import React from 'react'

const Bubble = ({ message }) => {
  const {content, role} = message
  console.log(`TEST-Bubble: content`)

  return (
    <div className={`${role} bubble`}>{content}</div>
  )
}

export default Bubble