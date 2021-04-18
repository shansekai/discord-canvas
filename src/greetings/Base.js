const { create, Client } = require('@open-wa/wa-automate')
const { color } = require('./utils')
const fs = require('fs-extra')
const msgHandler = require('./handler/message')
const canvas = require('discord-canvas')
const moment = require('moment-timezone')

// cache handler and check for file change
require('./handler/message')
nocache('./handler/message', module => console.log(`'${module}' Updated!`))

const start = (client = new Client()) => {
    console.log('[DEV]', color('NikkiXploit.com', 'yellow'))
    console.log('[CLIENT] CLIENT Started!')

    // Force it to keep the current session
    client.onStateChanged((state) => {
        console.log('[Client State]', state)
        if (state === 'CONFLICT' || state === 'DISCONNECTED') client.forceRefocus()
    })

    // listening on message
    client.onMessage((message) => {
        // Cut message Cache if cache more than 3K
        client.getAmountOfLoadedMessages().then((msg) => (msg >= 3000) && client.cutMsgCache())
        // Message Handler (Loaded from recent cache)
        require('./handler/message')(client, message)
    })
    
    // listening on Incoming Call
        client.onIncomingCall((call) => {
            client.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. TELEPON/VC BOT AUTO BLOCK!.\n\nMau di unblock? *harus* bayar 5k dan hubungi whatsapp owner: https://wa.me/62851577296392')
            .then(() => client.contactBlock(call.peerJid))
        }) 

    // listen group invitation
    /*client.onAddedToGroup(({ groupMetadata: { id }, contact: { name } }) =>
        client.getGroupMembersId(id)
            .then((ids) => {
                console.log('[CLIENT]', color(`Invited to Group. [ ${name} : ${ids.length}]`, 'yellow'))
                // conditions if the group members are less than 10 then the bot will leave the group
                if (ids.length <= 10) {
                    client.sendText(id, 'Sorry, the minimum group member is 10 user to use this bot. Bye~').then(() => client.leaveGroup(id))
                } else {
                    client.sendText(id, `Hello group members *${name}*, thank you for inviting this bot, to see the bot menu send *#menu*`)
                }
            }))*/  

    // listen paricipant event on group (wellcome message)
  /* client.onGlobalParicipantsChanged(async (event) => {
        const host = await client.getHostNumber() + '@c.us'
        let profile = await client.getProfilePicFromServer(event.who)
        if (profile == '' || profile == undefined) profile = 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU'
        // kondisi ketika seseorang diinvite/join group lewat link
        if (event.action === 'add' && event.who !== host) {
            await client.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
            await client.sendTextWithMentions(event.chat, `*NEW MEMBER* @${event.who.replace('@c.us', '')}\n\n*Welcome*😘`)
        }
        // kondisi ketika seseorang dikick/keluar dari group
        if (event.action === 'remove' && event.who !== host) {
            await client.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
            await client.sendTextWithMentions(event.chat, `*MEMBER LEAVE* @${event.who.replace('@c.us', '')}\n\n*GoodBye*🖐`)
        }
    })*/
    
    client.onGlobalParticipantsChanged(async (event) => {
        const _welcome = JSON.parse(fs.readFileSync('./settings/welcome.json'))
        const isWelcome = _welcome.includes(event.chat)
        const gcChat = await client.getChatById(event.chat)
        const pcChat = await client.getContact(event.who)
        let { pushname, verifiedName, formattedName } = pcChat
        pushname = pushname || verifiedName || formattedName
        const { name, groupMetadata } = gcChat
        const botNumbers = await client.getHostNumber() + '@c.us'
        try {
            if (event.action === 'add' && event.who !== botNumbers && isWelcome) {
                const pic = await client.getProfilePicFromServer(event.who)
                if (pic === undefined) {
                    var picx = 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU=false'
                } else {
                    picx = pic
                }
                const welcomer = await new canvas.Welcome()
                    .setUsername(pushname)
                    .setDiscriminator(`${moment().format('DD-MM-YY')}`)
                    .setMemberCount(groupMetadata.participants.length)
                    .setGuildName(name)
                    .setAvatar(picx)
                    .setColor('border', '#ffffff')
                    .setColor('username-box', '#ff0000')
                    .setColor('discriminator-box', '#ff0000')
                    .setColor('message-box', '#ff0000')
                    .setColor('title', '#ffffff')
                    .setBackground('https://raw.githubusercontent.com/shansekai/yusril-grabbed-result/main/img/wallpaperflaree.jpg')
                    .toAttachment()
                const base64 = `data:image/png;base64,${welcomer.toBuffer().toString('base64')}`
                await client.sendFile(event.chat, base64, 'welcome.png', `Welcome ${pushname} 😘`)
            } else if (event.action === 'remove' && event.who !== botNumbers && isWelcome) {
                const pic = await client.getProfilePicFromServer(event.who)
                if (pic === undefined) {
                    var picxs = 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU=false'
                } else {
                    picxs = pic
                }
                const bye = await new canvas.Goodbye()
                    .setUsername(pushname)
                    .setDiscriminator(`${moment().format('DD-MM-YY')}`)
                    .setMemberCount(groupMetadata.participants.length)
                    .setGuildName(name)
                    .setAvatar(picxs)
                    .setColor('border', '#ffffff')
                    .setColor('username-box', '#ff0000')
                    .setColor('discriminator-box', '#ff0000')
                    .setColor('message-box', '#ff0000')
                    .setColor('title', '#ffffff')
                    .setBackground('https://raw.githubusercontent.com/shansekai/yusril-grabbed-result/main/img/wallpaperflaree.jpg')
                    .toAttachment()
                const base64 = `data:image/png;base64,${bye.toBuffer().toString('base64')}`
                await client.sendFile(event.chat, base64, 'welcome.png', `Good Bye ${pushname} 👋`)
            }
        } catch (err) {
            console.error(err)
        }
    })
}         

/**
 * uncache if there is file change
 * @param {string} module module name or path
 * @param {function} cb when module updated <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for changes')
    require('fs').watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * uncache a module
 * @param {string} module module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

const options = {
    sessionId: 'Imperial',
    headless: true,
    qrTimeout: 0,
    authTimeout: 0,
    restartOnCrash: start,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: false,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ]
}

create(options)
    .then((client) => start(client))
    .catch((err) => new Error(err))
