import blessed from 'blessed'
import React from 'react'
import { render } from 'react-blessed'
import App from './App'

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'BIRD UP'
})

function bindKey (key, action) {
  screen.key(key, action)
}

function bindQuitKeys () {
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0)
  })
}

bindQuitKeys()

const fps = 20

const app = <App
  bindKey={bindKey}
  fps={fps}
/>

const component = render(app, screen)
