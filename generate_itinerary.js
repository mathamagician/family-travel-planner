// Improved rule-based itinerary generator for demo
// Usage: node generate_itinerary.js [input.json]
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || 'sample_input.json';
const activities = JSON.parse(fs.readFileSync('data/san_diego_activities.json'));
const input = JSON.parse(fs.readFileSync(inputPath));

function parseTime(t){const [h,m]=t.split(':').map(Number);return {h,m};}
function timeToDate(baseDate, t){const d=new Date(baseDate);d.setHours(t.h, t.m, 0, 0);return d;}
function dateToYMD(d){return d.toISOString().slice(0,10);} // YYYY-MM-DD
function addMinutesDate(dateObj, mins){return new Date(dateObj.getTime() + mins*60000);} 
function fmtTime(dateObj){return dateObj.toTimeString().slice(0,5);} 

function parseHoursRange(range){ // "09:00-17:00"
  if(!range || !range.includes('-')) return null;
  const [a,b]=range.split('-');return {open:parseTime(a),close:parseTime(b)};
}

const tripDays = input.trip_length_days;
const wake = parseTime(input.wake_time);
const napStart = parseTime(input.nap_window.start);
const napEnd = parseTime(input.nap_window.end);
const startDate = new Date(input.start_date + 'T00:00:00');

let plan = {profile: input.profile_name, destination: input.destination, days: []};

for(let d=0; d<tripDays; d++){
  const currentDate = addMinutesDate(startDate, d*24*60);
  const day = {day: d+1, date: dateToYMD(currentDate), slots: []};

  // pick activities round-robin but avoid repeats next to each other
  const morningAct = activities[(d*2)%activities.length];
  const afternoonAct = activities[(d*2+1)%activities.length];

  // Morning: schedule at max(wake, activity open time + 0 buffer)
  const morningOpen = parseHoursRange(morningAct.hours);
  let morningStart = timeToDate(currentDate, wake);
  if(morningOpen){
    const openDate = timeToDate(currentDate, morningOpen.open);
    if(openDate > morningStart) morningStart = openDate; // wait until open
  }
  day.slots.push({title: morningAct.name, start: fmtTime(morningStart), duration_mins: morningAct.duration_mins, location: morningAct.location});

  // Nap
  const napStartDate = timeToDate(currentDate, napStart);
  const napEndDate = timeToDate(currentDate, napEnd);
  day.slots.push({title: 'Nap / Rest', start: fmtTime(napStartDate), duration_mins: Math.round((napEndDate - napStartDate)/60000)});

  // Afternoon: start 30 mins after nap end but also respect activity opening
  let afternoonStart = addMinutesDate(napEndDate, 30);
  const afternoonOpen = parseHoursRange(afternoonAct.hours);
  if(afternoonOpen){
    const openDate = timeToDate(currentDate, afternoonOpen.open);
    if(openDate > afternoonStart) afternoonStart = openDate;
  }
  day.slots.push({title: afternoonAct.name, start: fmtTime(afternoonStart), duration_mins: afternoonAct.duration_mins, location: afternoonAct.location});

  // Evening
  const eveningStart = new Date(currentDate); eveningStart.setHours(18,0,0,0);
  day.slots.push({title: 'Early dinner / stroll / unwind', start: fmtTime(eveningStart), duration_mins: 90});

  plan.days.push(day);
}

fs.writeFileSync('sample_itinerary.json', JSON.stringify(plan,null,2));
console.log('Wrote sample_itinerary.json');
