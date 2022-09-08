const axios = require('axios').default
const cheerio = require('cheerio')
const cors = require('cors')
const express = require('express')
const formatTitle = require('./helpers/formatTitle')

const PORT = process.env.PORT || 3001
const app = express()

app.use(
  cors({
    origin: 'https://cdpn.io',
  })
)

app.listen(PORT, () => {
  if (process.env.PORT) {
    console.log(`Express server is running on port ${PORT}`)
  } else {
    console.log(`Express server is running on http://localhost:${PORT}`)
  }
})

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(
    '<p style="font-family: sans-serif; line-height: 1.4em;">Add an <strong>imdb_id</strong> on to the end of the URL.<br>e.g. <code style="font-size: 1.2em; background-color: #6d6d6d; color: white; padding: 0.2em 0.4em; border-radius: 0.2em;">/tt0111161</code></p>'
  )
})

app.get('/:imdb_id', async (req, res) => {
  let id = req.params['imdb_id']
  id = id.trim().toLowerCase()
  if (id.substring(0, 2) === 'tt') {
    const imdbUrl = `https://www.imdb.com/title/${id}/`
    console.log('imdbUrl:', imdbUrl)
    let data = {}
    do {
      const html = await downloadHtml(imdbUrl)
      data = extractData(id, html)
    } while (data.plot === '')
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(data))
  }
})

const downloadHtml = async (url) => {
  try {
    const response = await axios.get(url)
    console.log('response:', response)
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

  const title = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-80d4314-1.fbQftq > h1'
  ).text()
  data.title = title
  data.title_formatted = formatTitle(title)

  data.year = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-80d4314-1.fbQftq > div > ul > li:nth-child(1) > span'
  ).text()
  data.imdb_rating = parseFloat(
    $(
      '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-db8c1937-0.eGmDjE.sc-80d4314-3.iBtAhY > div > div:nth-child(1) > a > div > div > div.sc-7ab21ed2-0.fAePGh > div.sc-7ab21ed2-2.kYEdvH > span.sc-7ab21ed2-1.jGRxWM'
    ).text()
  )

  let numRatings = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-80d4314-0.fjPRnj > div.sc-db8c1937-0.eGmDjE.sc-80d4314-3.iBtAhY > div > div:nth-child(1) > a > div > div > div.sc-7ab21ed2-0.fAePGh > div.sc-7ab21ed2-3.dPVcnq'
  ).text()
  numRatings = numRatings.trim()
  const numRatingsLastChar = numRatings.substr(numRatings.length - 1)
  if (numRatingsLastChar === 'K') {
    numRatings = numRatings.replace('K', '')
    numRatings = parseFloat(numRatings) * 1000
  } else if (numRatingsLastChar === 'M') {
    numRatings = numRatings.replace('M', '')
    numRatings = parseFloat(numRatings) * 1000000
  }
  data.num_ratings = numRatings

  data.plot = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-16ede01-9.bbiYSi.sc-2a827f80-11.kSXeJ > div.sc-16ede01-7.hrgVKw > span.sc-16ede01-1.kgphFu'
  ).text()

  data.director = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-fa02f843-2.dwQKsL > div > div > ul > li:nth-child(1) > div > ul > li > a'
  ).text()

  const writersWrapperEl = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-fa02f843-0.fjLeDR > ul > li:nth-child(2) > div > ul > li.ipc-inline-list__item'
  )
  if (writersWrapperEl) {
    const writersArray = []
    writersWrapperEl.each((index, element) => {
      const name = $('a.ipc-metadata-list-item__list-content-item', element).text()
      if (name) {
        writersArray.push(name)
      }
    })
    data.writers = writersArray.join(', ')
  } else {
    data.writers = ''
  }

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
  if (srcset) {
    const srcsetArray = srcset.split(' ')
    const posterImageSrc = srcsetArray[srcsetArray.length - 2]
    data.poster_image_src = posterImageSrc
    data.poster_image_file_extension = posterImageSrc
      .substring(posterImageSrc.lastIndexOf('.') + 1, posterImageSrc.length)
      .toLowerCase()
  } else {
    data.poster_image_src = ''
    data.poster_image_file_extension = ''
  }

  let genres = $(
    '#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-ca85a21c-0.efoFqn > section > div:nth-child(4) > section > section > div.sc-2a827f80-2.kqTacj > div.sc-2a827f80-10.fVYbpg > div.sc-2a827f80-4.bWdgcV > div.sc-16ede01-9.bbiYSi.sc-2a827f80-11.kSXeJ > div.ipc-chip-list--baseAlt.ipc-chip-list.sc-16ede01-5.ggbGKe > div.ipc-chip-list__scroller'
  )
  if (genres) {
    genres = genres.text()
    data.genres = genres
      .replace(/([A-Z])/g, ', $1')
      .trim()
      .substring(2)
  } else {
    data.genres = ''
  }

  data.genres = genres
    .replace(/([A-Z])/g, ', $1')
    .trim()
    .substring(2)
  return data
}
