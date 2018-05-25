from datadog import initialize, api

options = {
    'api_key': 'baa4d41e9cbdd3ffc335a6acc3476071',
    'app_key': '939574ed252d9c574ef661bf926486a2961b0165'
}

initialize(**options)

title = "API Timeboard"
description = "A timeboard created programmatically with API."

graphs = [{
    "title": "My Custom Metric over Host",
    "definition": {
        "viz": "timeseries",
        "requests": [{
            "q": "avg:my_metric{host:precise64}",
            "type": "line",
            "aggregator": "avg"
       }]
    }
},
{
    "title": "MySQL CPU with Anomaly function",
    "definition": {
        "viz": "timeseries",
        "requests": [{
            "q": "anomalies(avg:mysql.performance.user_time{*}, 'basic', 2)",
            "type": "line",
            "aggregator": "avg"
      }]
    }
}]

template_variables = [{
    "name": "host1",
    "prefix": "host",
    "default": "host:precise64"
}]

read_only = True

api.Timeboard.create(title=title,
                     description=description,
                     graphs=graphs,
                     template_variables=template_variables,
                     read_only=read_only)
