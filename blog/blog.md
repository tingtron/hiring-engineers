
# Managing Errors at Saturation Point in Node.js Using DogStatsD and Hot-Shot Client



Using Vagrant hashicorp/precise64

## Installing Node.js ==

Follow Installing Node.js via package manager - Debian and Ubuntu based Linux distributions
    https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

NOTE: Since we are using Ubuntu Precise, 
we will read about running Node.js >= 6.x on older distros.
    https://github.com/nodesource/distributions/blob/master/OLDER_DISTROS.md


First ensure curl and certificates are up-to-date.
This may help prevent SSL transport issues.

    $ sudo apt-get update
    $ sudo apt-get -y install curl apt-transport-https ca-certificates

Install Clang
    $ sudo apt-get install -y clang-3.4

Install Node.js
    $ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

Test with hello.js

Forward VM ports to host in Vagrant

    config.vm.network "forwarded_port", guest: 8081, host: 8081, host_ip: "127.0.0.1"

## Configure DogStatsD

Follow https://docs.datadoghq.com/developers/dogstatsd/

Enable and configure DogStatsD in `datadog.yaml`

```
    use_dogstatsd: yes
    ...
    dogstatsd_port: 8125
```

Restart Agent.

## Test a Custom Metric

Using command line.
```
    $ echo -n "custom_metric:20|g|#shell" >/dev/udp/localhost/8125
```

Note: this is similar to using DataDog agent API, as in Python,
except, here we are sending a message directly to a local UDP server.
 
This approach of sending to a UDP server is used by many community
client libraries.

Verify the custom metrics in DataDog UI

010_Custom_Metric_Shell.png

## Choosing Libraries

Agent client

- Node.js
- Standard (StatsD vs custom API)
- API features

Note: Agent client libraries typically do not collect statistics,
they only communicate statistics to the Agent.

Server statistics

Web Server stats (requests per second, request time, number of errors etc)

 - [request](https://github.com/request/request) module
 - [request-stats](https://github.com/watson/request-stats) package 

Note: to see how to collect stats for requests originated in Node.js itself,
follow [Understanding & Measuring HTTP Timings with Node.js](https://blog.risingstack.com/measuring-http-timings-node-js/)

## Troubleshooting

On older Ubuntu distributions (precise), the versions of node and npm are outdated:
npm v1.1.4 and node v0.6.12.
This may cause conflicts with npm registry, e.g. getting an error "failed to fetch from registry".

Using `mvm` http://clubmate.fi/install-node-and-npm-to-a-ubuntu-box/

This will install the more recent versions of node (v0.11.14) and npm (2.0.0).

However, for more recent node versions, e.g. v10.3.0 (npm v6.1.0),
see https://github.com/creationix/nvm

If after reboot or new terminal session, the old version of node and npm is default, use
```
nvm ls
nvm use v10.3.0
nvm alias default v10.3.0   # for future
```

## Install hot-shots

https://www.npmjs.com/package/hot-shots
https://github.com/brightcove/hot-shots

```
$ npm install hot-shots
```

Test in command line:
```
$ node
```
Initialize Agent client:
```
var StatsD = require('hot-shots')
client = new StatsD()
```

Generate stats:
```
client.gauge('my_gauge', 123.45)
client.event('my_title', 'description')
client.increment('my_counter')
```

Verify the custom metrics in DataDog UI


020_Custom_Counters_Node.png

And custom Event in the Events dashboard:

030_Custom_Events_Node.png


## Sample Node.js Web Application

Although a small model application is used here for demonstration purposes,
in real production environments, it makes sense to have such a small model 
application with configurable processing and resource consumption parameters.
This would allow dry-running the environment to verify the instrumentation
infrastructure and veify the correct topology assumptions.


## Collecting Node.js Stats

Installing `request-stats`
```
npm install request-stats --save
```

Test using a simple web app and console output.


## Load Testing

Install loadtest. See https://www.npmjs.com/package/loadtest

```
npm install -g loadtest
```

Verify a simple test
```
$ loadtest -n 200 -c 10 --rps 20 http://127.0.0.1:8081/
```
See loadtest_test.txt

Note: to warm up Node.js server, the load should be increased gradually.
The above parameters is a good starting point.

Lower load rate (before saturation)
```
$ loadtest -n 2000 -c 200 --rps 500 http://127.0.0.1:8081/
```
Higher load rate (after saturation)
```
loadtest -n 2000 -c 500 --rps 1000 http://127.0.0.1:8081/
```


## Analysis of Pre-Error Metrics

Looking at related metrics, such as requests rate, system load etc, 
in the time before the errors start occurring, would give some
insight into pre-error behavior near the saturation point.

Creating Monitor Warnings, which look into such related metrics,
would allow alerting about potential server overload and allow
taking preventing measures to avoid errors, such as increasing
server resources or improving load balancing.


