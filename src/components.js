import React from 'react'

function Square ({ x, y, color }) {
  return (
    <box
      top={y}
      left={x}
      width="7%"
      height="13%"
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
    color: '#00aaaa'
  })
}
