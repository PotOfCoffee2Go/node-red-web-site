<img align="left" src="https://codescullery.net/poc2go/site/images/HAL9000.png" width="124px">
 <p><span style="font-size: 2em;">&nbsp;&nbsp;&nbsp;&#8220;... all my circuits are functioning perfectly.&#8221;</span></p>
 <p><span style="font-size: 1em;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- <i>HAL 9000</i>
    <a href="https://en.wikiquote.org/wiki/2001:_A_Space_Odyssey_(film)">(2001: A Space Odyssey)</a> </span></p>
<br>

### Objective
To show non-trivial examples of implementing Node-RED as a [data flow programming](https://en.wikipedia.org/wiki/Dataflow_programming)  component of a nodejs application.

Basically, how to interface to [node-red](https://nodered.org/) at a fundamental level to your nodejs application modules without creating node-red `nodes`.

There are advantages and disavantages to using [data flow programming](https://en.wikipedia.org/wiki/Dataflow_programming) as opposed to an [imperative programming](https://en.wikipedia.org/wiki/Imperative_programming) paradigm.  Once you get your head wrapped around the integration of these two seeming opposing paradigms - based on the situation - the better you can process, control, and deliver information.


### Purpose
This is a functional blog website which has been constructed using the concepts discussed below. It not only contains pages and posts describing the integration of node-red for flow control, but uses itself as an example of that paradigm. Security has not been taken into consideration as it is assumed the this project will be installed as an instructive tool, which when run is available at __http://localhost:8081__ in your web browser.

### Topics discussed (using this project as an example):
 - Embed node-red into an express site
 - Setting node-red configuration parameters from application embedding node-red
 - Use node-red to implement process sequences initiated by HTTP requests
 - How to interface node-red `function` nodes to nodejs `modules`
 - Integration of static content (css, js, etc.) with node-red processed data
 - Why using a nodejs database **module** (oracle, MS Sql, MySql, etc) is better than a node-red database **node**
 - When is it appropriate to create a node-red `node` or use a nodejs `module`
 - Delivery of HTML and/or RESTful content using node-red flows
 - Scenarios when usage of node-red sub-flows is advantageous
 - Creation and debugging custom node-red nodes
 - Discuss situations when a conventional nodejs module is appropriate versus a node-red node

### What is node-RED?
**To be concise:**

 - Node-Red is a high level, [flow based](https://en.wikipedia.org/wiki/Flow-based_programming) programming language implemented via a graphical interface (`Node-RED Editor`) used to describe sequences of [data flow](https://en.wikipedia.org/wiki/Dataflow_programming) movement (`msg`) between one or more **independent** synchronous and/or asynchronous processes (`nodes`).

 - The transmission of data consists of `wires` between none, one, or more in/out `ports` assigned to each `node`. The wires determine the <span style="color:blue;">path</span> of the `msg` data object which is the only interaction between `nodes`.

 - A `flow` is a sequence of `nodes` that are wired together. Since multiple `wires` can be connected to a single in/out `port`, a `flow` can have multiple  <span style="color:blue;">paths</span> which node-red executes concurrently. The data `msg` for each <span style="color:blue;">path</span> is cloned, thus the content of `msg` from one `path` can diverge from the `msg` content of another <span style="color:blue;">path</span> with-in the same `flow`.

 - Node-RED can run as a standalone application or can be embedded as the [data flow](https://en.wikipedia.org/wiki/Dataflow_programming) component of into a node.js application.
 
 - Changes to data flows are dynamic. Changes to data flows are immediately implemented by deploying the modifications to the node-red runtime.

### Installation
To see if you are interested, or wish to only see it's blog pages and posts:
```
npm install node-red-from-the-bottom
cd node-red-from-the-bottom
npm start
```
Then in address bar of your web browser:
```
http://localhost:8081
```

**However**, `node-red-from-the-bottom` is designed to be cloned so that you can inspect, modify, and play around with it.
```
git clone https://github.com/PotOfCoffee2Go/node-red-from-the-bottom.git
cd node-red-from-the-bottom.git
npm install
npm start
```

### Not as difficult as you might think
This blog site only has three javascript's, and one of those is only of interest to those creating custom nodes.

