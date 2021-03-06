import React from 'react'

function Square ({ x, y, color, width, height }) {
  return (
    <box
      top={y + '%'}
      left={x + '%'}
      width={width + '%'}
      height={height + '%'}
      style={{
        bg: color,
      }}
    />
  )
}

export function Bird (props) {
  return Square({
    x: 2,
    y: props.y,
    width: 7,
    height: 13,
    color: '#00aaaa',
  })
}

export function Wall (props) {
  return Square({
    x: props.x,
    y: props.y,
    width: 5,
    height: 50,
    color: 'red',
  })
}
