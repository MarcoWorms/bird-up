import React, { Component } from 'react'
import { Bird } from './components'
import logic from './logic'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = logic.initialState
  }
  enableJump () {
    this.props.bindKey('space', () =>
      this.setState(logic.birdUp)
    )
  }
  enableGravity () {
    setInterval(
      () => this.setState(logic.gravity),
      1000 / this.props.fps
    )
  }
  componentDidMount () {
    this.enableJump()
    this.enableGravity()
  }
  render () {
    return (
      <Bird y={this.state.bird.y} />
    )
  }
}
