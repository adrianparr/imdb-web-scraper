const axios = require('axios').default
const cheerio = require('cheerio')
const express = require('express')
const Fs = require('fs')
const Path = require('path')

const IMDB_IDs = ['https://www.imdb.com/title/tt0110912/', 'tt0109830', 'https://www.imdb.com/title/tt10738906/']
// const IMDB_IDs = ['tt0110912']
const PORT = 8000
const arrayOfData = []

const { runInContext } = require('vm')
const app = express()

app.listen(PORT, () => {
  console.log(`Express server is running on PORT:${PORT}`)
  startApp()
})

const downloadHtml = async (url) => {
  try {
    const response = await axios.get(url)
    return response.data
  } catch (err) {
    console.log('err')
  }
}

const extractData = (id, html) => {
  const data = {}
  const $ = cheerio.load(html)
  $.html()
  data.imdb_id = id
  data.imdb_url = `https://www.imdb.com/title/${id}/`
  data.title = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-80d4314-1.fbQftq > h1'
  ).text()
  data.year = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-80d4314-1.fbQftq > div > ul > li:nth-child(1) > span'
  ).text()
  data.imdb_rating = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-db8c1937-0.eGmDjE.sc-80d4314-3.iBtAhY > div > div:nth-child(1) > a > div > div > div.sc-7ab21ed2-0.fAePGh > div.sc-7ab21ed2-2.kYEdvH > span.sc-7ab21ed2-1.jGRxWM'
  ).text()
  const numRatings = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-db8c1937-0.eGmDjE.sc-80d4314-3.iBtAhY > div > div:nth-child(1) > a > div > div > div.sc-7ab21ed2-0.fAePGh > div.sc-7ab21ed2-3.dPVcnq'
  ).text()
  data.num_ratings = numRatings.replace('M', '000000')
  data.plot = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-16ede01-9.bbiYSi.sc-2a827f80-11.kSXeJ > div.sc-16ede01-7.hrgVKw > span.sc-16ede01-1.kgphFu'
  ).text()

  data.director = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-fa02f843-2.dwQKsL > div > div > ul > li:nth-child(1) > div > ul > li > a'
  ).text()

  const writersArray = []
  const writersWrapperEl = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-fa02f843-0.fjLeDR > ul > li:nth-child(2) > div > ul > li.ipc-inline-list__item'
  )
  writersWrapperEl.each((index, element) => {
    const name = $('a.ipc-metadata-list-item__list-content-item', element).text()
    writersArray.push(name)
  })
  data.writers = writersArray.join(', ')

  // data.writer = $(
  //   '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-fa02f843-2.dwQKsL > div > div > ul > li:nth-child(2) > div > ul > li > a'
  // ).text()

  const topCastWrapperEl = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > div > section > div > div.sc-18496876-1.bxQyHL.ipc-page-grid__item.ipc-page-grid__item--span-2 > section.ipc-page-section.ipc-page-section--base.sc-36c36dd0-0.bfKRTS.title-cast.title-cast--movie.celwidget > div.ipc-shoveler.ipc-shoveler--base.ipc-shoveler--page0.title-cast__grid > div.ipc-sub-grid.ipc-sub-grid--page-span-2.ipc-sub-grid--wraps-at-above-l.ipc-shoveler__grid > div > div.sc-36c36dd0-8.fSYMLK'
  )
  const actorsArray = []
  topCastWrapperEl.each((index, element) => {
    const name = $('a[data-testid="title-cast-item__actor"]', element).text()
    actorsArray.push(name)
  })
  data.actors = actorsArray.join(', ')
  const srcset = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-3.dhWlsy > div > div.sc-77a2c808-2.mcnrT > div > div > div.ipc-media.ipc-media--poster-27x40.ipc-image-media-ratio--poster-27x40.ipc-media--baseAlt.ipc-media--poster-l.ipc-poster__poster-image.ipc-media__img > img'
  ).attr('srcset')
  const srcsetArray = srcset.split(' ')
  const posterImageSrc = srcsetArray[srcsetArray.length - 2]
  data.poster_image_src = posterImageSrc
  data.poster_image_file_extension = posterImageSrc
    .substring(posterImageSrc.lastIndexOf('.') + 1, posterImageSrc.length)
    .toLowerCase()
  const genres = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-16ede01-9.bbiYSi.sc-2a827f80-11.kSXeJ > div.ipc-chip-list--baseAlt.ipc-chip-list.sc-16ede01-5.ggbGKe > div.ipc-chip-list__scroller'
  ).text()
  data.genres = genres
    .replace(/([A-Z])/g, ', $1')
    .trim()
    .substring(2)
  return data
}

const saveJsonToFile = async (filename, json) => {
  const jsonString = JSON.stringify(json, null, 2)
  const filenameWithExtension = `${filename}.json`
  await Fs.writeFile(`./saved-json/${filenameWithExtension}`, jsonString, (error) => {
    if (error) return console.log(error)
  })
  return filenameWithExtension
}

const savePosterImageToFile = async (id, posterImageSrc) => {
  const path = Path.resolve(__dirname, '../saved-poster-images', `${id}.jpg`)
  try {
    const response = await axios({
      method: 'GET',
      url: posterImageSrc,
      responseType: 'stream',
    })
    response.data.pipe(Fs.createWriteStream(path))
  } catch (err) {
    console.log('err')
  }
  return id
}

const startApp = async () => {
  console.log('startApp()')
  for (let i = 0; i < IMDB_IDs.length; i++) {
    const item = IMDB_IDs[i]
    let id = ''
    if (item.startsWith('http')) {
      id = item.split('/')[4]
    } else if (item.startsWith('tt')) {
      id = item
    }
    console.log('================================================================================================')
    console.log(`ID: ${id}`)
    console.log('================================================================================================')
    const imdbUrl = `https://www.imdb.com/title/${id}/`
    const html = await downloadHtml(imdbUrl)
    const data = extractData(id, html)
    arrayOfData.push(data)
    const savedJsonId = await saveJsonToFile(id, data)
    const savedPosterImageId = await savePosterImageToFile(id, data.poster_image_src)
  }
  console.log('arrayOfData:', arrayOfData)
  await saveJsonToFile('all-movies', arrayOfData)
  const numMoviesSaved = arrayOfData.length
  console.log(`Number of movies saved: ${numMoviesSaved}`)
}
