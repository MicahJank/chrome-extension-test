
// called when the user clicks on the browser action
// when an extension adds an icon nex to the address bar - that is a browser action
// this adds a click listener to that icon/brower action
chrome.browserAction.onClicked.addListener(function(tab) {
    // Sends a message to the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    })
})

// onMessage is listening for whenever a message is sent out
chrome.runtime.onMessage.addListener(
    // remember request is what is being sent from the message object
    function(request, sender, sendResponse) {
        if(request.message === "open_new_tab") {
            chrome.tabs.create({"url": request.url}) 
        }
    }
)