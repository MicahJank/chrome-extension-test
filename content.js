let jcrop, selection;

const overlay = (active => state => {
    active = typeof state === 'boolean' ? state : state === null ? active : !active;
    $('.jcrop-holder')[active ? 'show' : 'hide']();
    chrome.runtime.sendMessage({message: 'active', active});
})(false)


const createImage = done => {
    const image = new Image();
    image.id = 'fake-image';
    // image.src = chrome.runtime.getURL('')
    image.onload = () => {
        $('body').append(image);
        done();
    }
}

var init = (done) => {
    console.log("FROM THE CONTENT.JS/init");
    $('#fake-image').Jcrop({
        bgColor: 'none',
        onSelect: e => {
            selection = e;
            capture();
        },
        onChange: e => {
            selection = e;
        },
        onRelease: e => {
            setTimeout(() => {
                selection = null;
            }, 100);
        }
    }, function ready() {
        jcrop = this;
        $('.jcrop-hline, .jcrip-vline').css({ backgroundImage: `url(${chrome.runtime.getURL('/images/Jcrop.gif')})`
    });
        if (selection) {
            jcrop.setSelect([selection.x, selection.y, selection.x2, selection.y2])
        }

        done && done();
    })
}

const capture = force => {
    chrome.storage.sync.get(config => {
        if (selection && (config.method === 'crop' || (config.method === 'wait' && force))) {
            jcrop.release();
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    message: 'capture', area: selection, drp: devicePixelRatio
                }, (res) => {
                    overlay(false);
                    selection = null;
                    save(res.image, config.format, config.save)
                })
            }, 50)
        }
    })
}

const filename = format => {
    const pad = (n) => (n = n + '', n.length >= 2 ? n : `0${n}`);
    const ext = format => format === 'jpeg' ? 'jpg' : format === 'png' ? 'png' : 'png';
    const timestamp = now => {
        [pad(now.getFullYear()), pad(now.getMonth() + 1), pad(now.getDate())].join('-') 
        + ' - ' + 
        [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('-');
        return `Screenshot - ${timestamp(new Date())}.${ext(format)}`;
    }
}

const save = (image, format, save) => {
    if (save === 'file') {
      const link = document.createElement('a')
      link.download = filename(format)
      link.href = image
      link.click()
    }
    else if (save === 'clipboard') {
      navigator.clipboard.writeText(image).then(() => {
        alert([
          'Screenshot Capture:',
          `${image.substring(0, 40)}...`,
          'Saved to Clipboard!'
        ].join('\n'))
      })
    }
  }

window.addEventListener('resize', ((timeout) => () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
    //   jcrop.destroy()
    //   init(() => overlay(null))
    }, 100)
  })())


  chrome.runtime.onMessage.addListener((req, sender, res) => {
    if (req.message === 'init') {
        
      res({}) // prevent re-injecting
  
      if (!jcrop) {
        createImage(() => init(() => {
          overlay()
          capture()
        }))
      }
      else {
        overlay()
        capture(true)
      }
    }
    return true
  })

// // the state of the extension
// let active = false;

// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         // now the console log only runs when the correct message is recieved
//         // which if we set up the background.js correctly should happen
//         // every time we click on the extension
//         if (request.message === "clicked_browser_action") {
//             const firstHref = $("a[href^='http']").eq(0).attr("href");
//             console.log(firstHref);
            
//             // if content.js recieves the clicked browser action message then we send a message back to background.js telling it the url it needs to open
//             chrome.runtime.sendMessage({"message": "open_new_tab", "url": firstHref})

//         }
//     }
// )

