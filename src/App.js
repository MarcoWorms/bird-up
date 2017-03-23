import React, { Component } from 'react'
import { Bird } from './components'
import logic from './logic'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = logic.initialState
  }
  componentDidMount () {
    this.props.bindKey('space', () => this.setState(logic.birdUp))
    setInterval(() => this.setState(logic.snailDown), 1000 / this.props.fps)
  }
  render () {
    return (
      <Bird y={this.state.bird.y} />
    )
  }
}
