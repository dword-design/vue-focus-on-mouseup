import { endent } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import { outputFile } from 'fs-extra'
import { Builder, Nuxt } from 'nuxt'
import P from 'path'
import puppeteerToIstanbul from 'puppeteer-to-istanbul'
import withLocalTmpDir from 'with-local-tmp-dir'

const storagePath = P.resolve('.nyc_output')

export default {
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFile(
        'pages/index.vue',
        endent`
          <template>
            <button v-focus-on-mouseup>Hello world</button>
          </template>
          
          <script>
          import focusOnMouseup from '../../src'

          export default {
            directives: { focusOnMouseup },
          }
          </script>

        `
      )

      const nuxt = new Nuxt({ createRequire: 'native', dev: true })
      await new Builder(nuxt).build()
      await nuxt.listen()

      const browser = await puppeteer.launch()

      const page = await browser.newPage()
      await page.coverage.startJSCoverage()
      await page.goto('http://localhost:3000')

      const buttonCoords = await page.evaluate(() => {
        const button = document.querySelector('button')

        const bounds = button.getBoundingClientRect()

        return {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        }
      })
      await page.mouse.move(buttonCoords.x, buttonCoords.y)

      const hasFocus = () =>
        page.evaluate(
          () => document.activeElement === document.querySelector('button')
        )
      expect(await hasFocus()).toBeFalsy()
      await page.mouse.down()
      expect(await hasFocus()).toBeFalsy()
      await page.mouse.up()
      expect(await hasFocus()).toBeTruthy()

      const coverage = await page.coverage.stopJSCoverage()
      puppeteerToIstanbul.write(coverage, { storagePath })
      await browser.close()
      await nuxt.close()
    }),
}
