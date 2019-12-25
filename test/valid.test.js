import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import puppeteer from 'puppeteer'
import P from 'path'
import express from 'express'
import portfinder from 'portfinder'
import packageConfig from './package.config'
import expect from 'expect'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': JSON.stringify(sortPackageJson({
      ...packageConfig,
      dependencies: {
        'vue': '^1.0.0',
      },
      devDependencies: {
        [getPackageName(require.resolve('@dword-design/base-config-vue-app'))]: '^1.0.0',
      },
    }), undefined, 2),
    'src/index.js': endent`
      import Vue from '${getPackageName(require.resolve('vue'))}'
      import focusOnMouseup from '@dword-design/vue-focus-on-mouseup'

      new Vue({
        el: '#app',
        directives: { focusOnMouseup },
        render: () => <button v-focus-on-mouseup>Hello world</button>,
      })
    `,
  })

  await spawn('base', ['build'])

  const port = await portfinder.getPortPromise()
  const app = express().use(express.static(P.resolve('dist'))).listen(port)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`http://localhost:${port}`)
  const { x, y } = await page.evaluate(async () => {
    const button = document.querySelector('button')
    const { x, y, width, height } = button.getBoundingClientRect()
    return { x: x + width / 2, y: y + height / 2 }
  })
  await page.mouse.move(x, y)

  const hasFocus = () => page.evaluate(() => document.activeElement === document.querySelector('button'))

  expect(await hasFocus()).toBeFalsy()
  await page.mouse.down()
  expect(await hasFocus()).toBeFalsy()
  await page.mouse.up()
  expect(await hasFocus()).toBeTruthy()
  await browser.close()
  app.close()
})
