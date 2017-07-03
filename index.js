const axios = require("axios");
const Either = require("data.either");
const head = require("ramda/src/head");
const Task = require("data.task");
const twilio = require("twilio");

require("dotenv").config();

const CLIENT = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const URL =
  "https://api.meetup.com/" +
  "suncoast-js" +
  "/events?key=" +
  process.env.MEETUP_API_KEY +
  "&page=1&only=yes_rsvp_count,name&sign=true";

function getData() {
  return new Task((rej, res) => {
    axios.get(URL).then(resp => res(buildMessage(resp.data))).catch(rej);
  });
}

function buildMessage(data) {
  const event = head(data);
  return event
    ? Either.Right(
        `You have ${event.yes_rsvp_count} person(s) coming to "${event.name}"`
      )
    : Either.Left("There are no upcoming meet ups");
}

function sendMessage(msg) {
  return new Task((rej, res) => {
    CLIENT.messages.create(
      {
        to: process.env.MY_NUMBER,
        from: process.env.MY_TWILIO_NUMBER,
        body: msg
      },
      function(err, message) {
        if (err) rej(err);
        res(message.body);
      }
    );
  });
}

function eitherToTask(e) {
  return e.fold(Task.rejected, Task.of);
}

// EXECUTE

getData().chain(eitherToTask).chain(sendMessage).fork(
  err => {
    console.error(`There was an error: ${err}`);
  },
  res => {
    console.log(`Message sent successfully: ${res}`);
  }
);
