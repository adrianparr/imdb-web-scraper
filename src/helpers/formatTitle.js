module.exports = (title) => {
  let formattedTitle = title.trim()
  const numChars = formattedTitle.length
  const firstFourChars = formattedTitle.substring(0, 4)
  const firstTwoChars = formattedTitle.substring(0, 2)
  if (firstFourChars.toLowerCase() === 'the ') {
    formattedTitle = `${formattedTitle.substring(4, numChars)}, The`
  } else if (firstTwoChars.toLowerCase() === 'a ') {
    formattedTitle = `${formattedTitle.substring(2, numChars)}, A`
  }
  return formattedTitle
}
