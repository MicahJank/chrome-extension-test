chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // now the console log only runs when the correct message is recieved
        // which if we set up the background.js correctly should happen
        // every time we click on the extension
        if (request.message === "clicked_browser_action") {
            const firstHref = $("a[href^='http']").eq(0).attr("href");
            console.log(firstHref);

        }
    }
)

