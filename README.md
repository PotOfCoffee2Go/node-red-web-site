<img align="left" src="https://codescullery.net/poc2go/site/images/HAL9000.png" width="124px">
<div>
 <p><span style="font-size: 1.7em;">&nbsp;&nbsp;&nbsp;&#8220;... all my circuits are functioning perfectly.&#8221;</span></p>
 <p><span style="font-size: 1em;padding-left:60px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- <i>HAL 9000</i>
    <a href="https://en.wikiquote.org/wiki/2001:_A_Space_Odyssey_(film)">(2001: A Space Odyssey)</a> </span></p>
</div>
<br><br>

<span style="font-size: 1.1em;"> This project is a functional blog website which contains pages and posts describing the integration of [Node-RED](https://nodered.org/) for process flow control.

The site is constructed as an example of the concepts discussed below.</span>

Documentation is as fundamental as possible; however, it is assumed one has at least an intermediate understanding of [HTML](https://en.wikipedia.org/wiki/HTML),  [Node.js](https://nodejs.org/), [expressjs](https://expressjs.com/), and [Node-RED](https://nodered.org/).

 > **Note:** This project is an instructive tool installing itself locally at `http://localhost:8081`. **Anybody** with access to the site can modify blog pages and posts. 

----

### Objectives
 - Show non-trivial examples of implementing [Node-RED](https://nodered.org/) as the [controller and view](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) components of an application.

 - Interface [Node-RED](https://nodered.org/) to Model, [Business](https://en.wikipedia.org/wiki/Business_logic), and [Presentation](https://en.wikipedia.org/wiki/Presentation_logic) Logic components written as conventional [node.js](https://nodejs.org/en/) modules.

 - Simplified creation and debugging of application specific [Node-RED nodes](https://nodered.org/docs/creating-nodes/).

### Topics

**Examples**:
 - Embed [Node-RED](https://nodered.org/) into an express site
 - Setting [Node-RED](https://nodered.org/) configuration parameters
 - Use [Node-RED](https://nodered.org/) to implement process sequences initiated by HTTP requests
 - Deliver HTML and/or RESTful content using [Node-RED](https://nodered.org/) flows
 - Delivery of static content (css, js, etc.) along side [Node-RED](https://nodered.org/) flows
 - How to interface [Node-RED](https://nodered.org/) `function` nodes to nodejs `modules`
 - Creation and debugging of application specific [Node-RED nodes](https://nodered.org/docs/creating-nodes/)

**Discuss**:
 - Situations when a conventional nodejs module is appropriate versus a node-red node
 - Scenarios when usage of node-red sub-flows is advantageous

**IMHO**:
 - Where is the **'Logic'** in [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)???

----

### What is node-RED?
**To be concise:**

 - [Node-RED](https://nodered.org/) is a [flow based](https://en.wikipedia.org/wiki/Flow-based_programming) programming language developed and maintained on [GitHub](https://github.com/node-red) by UK based [IBM Emerging Technology Group](https://emerging-technology.co.uk/) licensed under the family of open-source projects sponsored by the [JS Foundation](https://js.foundation/community/projects).

 - Process flows are implemented via a graphical interface (`Node-RED Editor`) used to describe sequences of [data flow](https://en.wikipedia.org/wiki/Dataflow_programming) movement (`msg`) between one or more _independent_ synchronous and/or asynchronous processes (`nodes`).

 - The transmission of data consists of `wires` between one or more in/out `ports` assigned to each `node`. The wires determine the <span style="color:blue;">path</span> of the `msg` data object which is the only interaction between `nodes`.

 - A `flow` is a sequence of `nodes` that are wired together. Since multiple `wires` can be connected to a single in/out `port`, a `flow` can have multiple  <span style="color:blue;">paths</span> which node-red executes concurrently. The data `msg` content is cloned for each <span style="color:blue;">path</span> thus the content of `msg` from one `path` can diverge from the `msg` content of another <span style="color:blue;">path</span>.

 - [Node-RED](https://nodered.org/) can run as a standalone application or can be embedded as a module of a node.js application.
 
 - Changes to flows are dynamic. Flows modified in the `Node-RED Editor` are immediately implemented by _deploying_ to the [Node-RED](https://nodered.org/) runtime.

----

### Installation
To see if you are interested, or wish to only see blog pages and posts:
```bat
npm install node-red-from-the-bottom
cd node-red-from-the-bottom
npm start
```
Then in address bar of your web browser:
```
http://localhost:8081
```

**However**, `node-red-from-the-bottom` is designed to be cloned so that you can inspect, modify, and play around with it.
```bat
git clone https://github.com/PotOfCoffee2Go/node-red-from-the-bottom.git
cd node-red-from-the-bottom
npm install
npm start
```

### Not as difficult as you might think
This blog site is made up of only three javascript code files (excluding custom [Node-RED nodes](https://nodered.org/docs/creating-nodes/)).

