# Weaver Rest Client Server SDK
![WeaverRest](http://www.weavingthings.com/technical_docs/smartlights_walkthrough/images/produvia_man_home.png)
##### Weaver Rest is a smart-lights controller reference application
##### powered by the [Weaver SDK]

## 
## [Weaver SDK]
##### [Weaver SDK] is a cloud service and SDK that, lets developers connect and control smart devices easily saving the need to implement and maintain many different APIs and SDKs
###
### Description
##### Weaver Rest uses the Weaver SDK in order to:
  - Manage users (login and registration)
  - Scan and remember smart lighting services inside the network
  - Display and support many smart light services with one simple [JSON API]
   
##### Weaver Rest currenetly supports: Philips Hue, Lifx, Flux, and OSRAM smart bulbs. 
##### More devices are coming soon.
##

### How To Use Weaver Rest SDK
- Simply download this repository which includes the JAVA server and a simple HTTP client
- [Join our beta program] to receive your Weaver-SDK API KEY
- Build the WeaverServer using running ant from EprHttpServer folder
- Also checkout the [Documentation]


### Installation

Download this repository which includes the JAVA server and a simple HTTP client.
Compile and run the server with the following args: -p SERVER_PORT -a WeaverSdkAPIKey

```sh
  cd EprHttpServer; ant; java -jar WeaverHttpServer.jar -p 8000  -a xxxxxxxxxxxxx
```
> The goal of the WeaverSDK is to let developers concentrate on developing their UI without the need to bother with maintaining tons of APIs.
> Weaver uses a simple JSON api in order to scan for and control smart devices.
> Whenever new device support is added, apps will usually automatically support the new devices without the need to update and rebuild the code!


### Documentation
- [Documentation]


License
----

The Weaver Rest app is distributed under the MIT License

   [JSON API]: <http://weavingthings.com/weaver-sdk-reference/>
   [Join our beta program]: <http://weavingthings.com/#contact>
   [Documentation]: <http://weavingthings.com/weaver-sdk-reference/>
   [Weaver SDK]: <http://weavingthings.com>
   
