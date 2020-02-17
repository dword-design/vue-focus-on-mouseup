import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import puppeteer from '@dword-design/puppeteer'
import kill from 'tree-kill'
import portReady from 'port-ready'

export default {
  valid: () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "dependencies": {
            "@dword-design/vue-focus-on-mouseup": "^1.0.0"
          },
          "devDependencies": {
            "${getPackageName(require.resolve('@dword-design/base-config-nuxt'))}": "^1.0.0"
          }
        }

      `,
      'src/pages/index.js': endent`
        import focusOnMouseup from '@dword-design/vue-focus-on-mouseup'

        export default {
          directives: { focusOnMouseup },
          render: () => <button v-focus-on-mouseup>Hello world</button>,
        }
      `,
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = execa.command('base start', { stdio: 'inherit' })
    await portReady(3000)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    const { x, y } = await page.evaluate(() => {
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
    kill(childProcess.pid)
  }),
}
