// checks the chrome storage to and if any of the config properties are not already set, it sets them
chrome.storage.sync.get((config) => {
    if (!config.method) {
      chrome.storage.sync.set({method: 'crop'})
    }
    if (!config.format) {
      chrome.storage.sync.set({format: 'png'})
    }
    if (!config.save) {
      chrome.storage.sync.set({save: 'file'})
    }
    if (config.dpr === undefined) {
      chrome.storage.sync.set({dpr: true})
    }
  })

// puts the css and javascript files at the start of the document of the tab
  function inject (tab) {
    chrome.tabs.sendMessage(tab.id, {message: 'init'}, (res) => {
      if (res) {
        clearTimeout(timeout)
      }
    })
  
    var timeout = setTimeout(() => {
      chrome.tabs.insertCSS(tab.id, {file: 'jquery/jquery.Jcrop.min.css', runAt: 'document_start'})
      chrome.tabs.insertCSS(tab.id, {file: 'css/content.css', runAt: 'document_start'})
  
      chrome.tabs.executeScript(tab.id, {file: 'jquery/jquery.min.js', runAt: 'document_start'})
      chrome.tabs.executeScript(tab.id, {file: 'jquery/jquery.Jcrop.min.js', runAt: 'document_start'})
      chrome.tabs.executeScript(tab.id, {file: 'content.js', runAt: 'document_start'})
  
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {message: 'init'})
      }, 100)
    }, 100)
  }


// called when the user clicks on the browser action
// injects the javascript and css when clicked
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log('action clicked')
    inject(tab)
    // Sends a message to the active tab
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //     const activeTab = tabs[0];
    //     chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    // })
})

// commands.onCommand is looking for when a keyboard shortcut is pressed and then activates the command, dependent on what you set in the manifest.json
chrome.commands.onCommand.addListener((command) => {
    if (command === 'take-screenshot') {
      chrome.tabs.query({active: true, currentWindow: true}, (tab) => {
        inject(tab)
      })
    }
  })



chrome.runtime.onMessage.addListener((req, sender, res) => {
    if (req.message === 'capture') {
        chrome.storage.sync.get(config => {
            chrome.tabs.query({active: true, currentWindow: true}, tab => {
                chrome.tabs.captureVisibleTab(tab.windowId, {format: config.format}, image => {
                    if (config.method === 'crop') {
                        crop(image, req.area, req.dpr, config.dpr, config.format, cropped => {
                            res({message: 'image', image: cropped})
                        })
                    }
                })
            })
        })
    } else {
        chrome.browserAction.setTitle({tabId: sender.tab.id, title: 'Screenshot Capture'})
        chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: ''})
    }

    return true;
})


function crop (image, area, dpr, preserve, format, done) {
    var top = area.y * dpr
    var left = area.x * dpr
    var width = area.w * dpr
    var height = area.h * dpr
    var w = (dpr !== 1 && preserve) ? width : area.w
    var h = (dpr !== 1 && preserve) ? height : area.h
  
    var canvas = null 
    if (!canvas) {
      canvas = document.createElement('canvas')
      document.body.appendChild(canvas)
    }
    canvas.width = w
    canvas.height = h
  
    var img = new Image()
    console.log('image: ', img)
    img.onload = () => {
      var context = canvas.getContext('2d')
      context.drawImage(img,
        left, top,
        width, height,
        0, 0,
        w, h
      )
  
      var cropped = canvas.toDataURL(`image/${format}`)
      done(cropped)
    }
    img.src = image
  }