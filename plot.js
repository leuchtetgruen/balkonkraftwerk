const langStrings = {
  "de-DE": {
    "appTitle": "Solar-Dashboard",
    "currently": "Aktuell",
    "maximum": "Maximum",
    "now": "Jetzt",
    "in this hour": (a) => `Zwischen ${a[0]} und ${a[1]} Uhr`,
    "today": "Heute",
    "last 30 days": "Letzte 30 Tage",
    "wh per day": "Wh/Tag",
    "average wh": (a) => `Durchschnitt (${a[0]} Wh)`,
    "sun minutes": "Sonnenminuten (in 10-Min-Abschnitten)",
    "hourly power": "Wh/Tagesstunde",
    "hourly power title": "Leistung über den Tag verteilt",
  },
  "en-US": {
    "appTitle": "Solar Dashboard",
    "currently": "currently",
    "maximum": "max.",
    "now": "now",
    "in this hour": (a) => `Between ${a[0]} and ${a[1]} o'clock`,
    "today": "today",
    "last 30 days": "During last 30 days",
    "wh per day": "Wh/day",
    "average wh": (a) => `Average (${a[0]} Wh)`,
    "sun minutes": "Sun (in 10-Min intervals)",
    "hourly power": "Wh/hour in the day",
    "hourly power title": "Power throughout the day",
  }

};

let localize = function(key, args=[]) {
  lang = navigator.language;
  if (langStrings[lang] == undefined) {
    lang = "en-US";
  }
  
  langDict = langStrings[lang];
  if (langDict[key] == undefined) {
    return key;
  }
  else if ((typeof langDict[key]) == 'function'){
    return langDict[key].call({}, args)
  }
  else {
    return langDict[key];
  }
}

let setTitle = function(id, text) {
  document.querySelector(`#${id}`).innerText = text;
}

let loadData = function() {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "/data.json");
  xhr.send();
  xhr.onload = function() {
    data = JSON.parse(xhr.response);
    console.log(data);

    setTitle("curTitle", localize("currently"))
    drawDonut(data['cur'], data['cur_max'], [localize("currently"), localize("maximum")], '#F9E79F','cur')

    let curHr = (new Date()).getHours();
    let nextHr = curHr + 1;
    setTitle("hourTitle", localize("in this hour", [curHr, nextHr]));
    drawDonut(data['cur_hr'], data['hr_max'], [localize('currently'), localize('maximum')], '#E8DAEF', 'hour');

    setTitle("todayTitle", localize("today"))
    drawDonut(data['today'], data['30d_max'], [localize('today'), localize('maximum')], '#D6EAF8', 'today');

    setTitle("monthTitle", localize("last 30 days"));
    drawDonut(data['month'], data['mth_max'], [localize("last 30 days"), localize("maximum")], '#D5F5E3', 'month');
    
    setTitle("monthTitleTimeline", localize("last 30 days"));
    drawTimeline(data['30d'], data['30d_avg'], data['sun'], 'timeline', localize("wh per day"))

    setTitle("hourlyAveragesTitle", localize("hourly power title"))
    drawHours(data['hours_avg'], "hourlyAverages", localize("hourly power"));
  };
}

let drawDonut = function(value, total, labels, highlightColor, id) {
  const data = {
    labels: [ 
      labels[0] + " (" + value + "Wh)",  
      labels[1] + " (" + total + "Wh)",  
    ],
    datasets: [{
      label: "Data",
      data: [value, Math.max(total - value, 0)],
      backgroundColor: [
        highlightColor,
        '#eeeeee'
      ]
    }]
  };
  const config = {
    type: 'doughnut',
    data: data,
    options: {  
      responsive: true,
      maintainAspectRatio: false
    }
  };

  const myChart = new Chart(
    document.getElementById(id),
    config
  );
}

let drawHours = function(averages, id, title) {
  const data = {
    labels: [...Array(24).keys()].map((i) => i.toString()),
    datasets: [{
      label: title,
      data: averages,
      borderColor: 'red',
      fill: false,
      cubicInterpolationMode: 'monotone',
      tension: 0.4
    }]
  }

  const config = {
    type: 'line',
    data: data,
    options: {  
      responsive: true,
      maintainAspectRatio: false
    }
  };

  const myChart = new Chart(
    document.getElementById(id),
    config
  );

}

let drawTimeline = function(values, avg, sun, id, title) {
  startDate = (new Date()).valueOf() - (29 * 24 * 60 * 60 * 1000);
  const data = {
    labels: values.map((v, i) => (new Date(startDate + (i*24*60*60*1000)).toLocaleDateString())),
    datasets: [{
      label: title,
      data: values,
      borderColor: 'red',
      fill: false,
      cubicInterpolationMode: 'monotone',
      tension: 0.4
    },
      {
        label: localize("average wh", [avg]), //"Average (" + avg.toString() + "Wh)",
        data: values.map((v) => avg),
        borderColor: 'blue'
      },
      {
        label: localize("sun minutes"),
        data: sun,
        borderColor: "orange",
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }
    ]
  }

  const config = {
    type: 'line',
    data: data,
    options: {  
      responsive: true,
      maintainAspectRatio: false
    }
  };

  const myChart = new Chart(
    document.getElementById(id),
    config
  );
}
