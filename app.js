const express = require('express')
const axios = require('axios')
const path = require('path');

const startOfToday = require('date-fns/start_of_today')
const addDays = require('date-fns/add_days')
const format = require('date-fns/format')
const parse = require('date-fns/parse')
const getTime = require('date-fns/get_time')

const app = express()

app.set('view engine', 'pug')
app.set('views', `${__dirname}/views`)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
    res.send('Hello world')
})

const START_DATE = startOfToday()
const END_DATE = addDays(START_DATE, 7)

const getEventBriteEvents = async () => {
  var agent = axios.create({
      baseURL: 'https://www.eventbriteapi.com/v3/',
      params: {token: 'RYLCCITD5HPXB25IUCKM'}
  });

  const response = await agent.get('events/search/', {
      params: {
          'location.address': 'berlin',
          'start_date.range_start': format(START_DATE, 'YYYY-MM-DDTHH:mm:ss'),
          'start_date.range_end': format(END_DATE, 'YYYY-MM-DDTHH:mm:ss'),
          'categories': '102'
      }
  })
  return response.data.events
}

const getMeetupEvents = async () => {
  var agent = axios.create({
      baseURL: 'https://api.meetup.com/',
      params: {key: '76471863263d3d4d20707265173f3a'}
  });

  // must follow this format: YYYY-MM-DDTHH:MM:SS
  const endDate = format(END_DATE, 'YYYY-MM-DDTHH:mm:ss')

  const response = await agent.get('find/upcoming_events', {
    params: {
        'end_date_range': endDate,
        'topic_category': '292'
    }
  }).catch((error) => {
      if(error.response) {
        console.log(error.response)
      }
      console.log("Error getting events: ", error);
    })

  return response.data.events
}

const formatMeetupEvents = (events) => {
  return events.map(event => {

    return {
      name: event.name,
      timestamp: event.time,
      time: format(event.time, 'DD/MM/YYYY HH:mm'),
      type: 'M',
      description: event.description,
      link: event.link
    }
  })
}

const formatEventBriteEvents = (events) => {
  return events.map(event => {
    return {
      name: event.name.text,
      timestamp: getTime(event.start.local),
      time: format(event.start.local, 'DD/MM/YYYY HH:mm'),
      type: 'E',
      description: event.description.html,
      link: event.url
    }
  })
}


app.get('/events', async (req, res, next) => {

    let events = [];
    const meetupEvents = await getMeetupEvents()
    events = events.concat(formatMeetupEvents(meetupEvents))

    const eventBriteEvents = await getEventBriteEvents()
    events = events.concat(formatEventBriteEvents(eventBriteEvents))

    events.sort((a, b) => {
        return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
    })

    res.render('events', {events})
})

module.exports = app
