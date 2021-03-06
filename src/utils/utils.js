const fs = require('fs');
const axios = require('axios');
const config = require('../../config.json');
const {Logger} = require('sylphy');
const logger = new Logger();
const chalk = require('chalk');
const opposites = require('../utils/constants').opposites;

/**
 *
 * @param file
 * @param ext
 * @param data
 * @param minSize
 * @param log
 * @return {Promise<any>}
 */
exports.safeSave = (file, ext, data, minSize = 5, log = true) => {
    return new Promise(async (resolve, reject) => {
        if (!file || !ext || !data)
            return reject(new Error('Invalid arguments'));
        if (file.startsWith('/')) file = file.substr(1);
        if (!ext.startsWith('.')) ext = '.' + ext;
        try {
            await fs.writeFileSync(`${__dirname}/../${file}-temp${ext}`, data);
        } catch (error) {
            logger.error(chalk.red.bold(`[SAFE SAVE WRITE] ${error}`));
            reject(error);
        }
        try {
            let stats = await fs.statSync(`${__dirname}/../${file}-temp${ext}`);
            if (stats['size'] < minSize) {
                logger.debug(chalk.blue.bold('[SAFE SAVE] Prevented file from being overwritten'));
                resolve(false);
            } else {
                try {
                    await fs.renameSync(`${__dirname}/../${file}-temp${ext}`, `${__dirname}/../${file}${ext}`);
                    resolve(true);
                    if (log === true) logger.debug(chalk.blue.bold(`[SAFE SAVE] Updated ${file}${ext}`));
                } catch (error) {
                    logger.error(chalk.red.bold(`[SAFE SAVE RENAME] ${error}`));
                    reject(error);
                }
            }
        } catch (error) {
            logger.error(chalk.red.bold(`[SAFE SAVE STAT] ${error}`));
            reject(error);
        }
    });
};

/**
 * Find a user
 * @param {Object} msg - The message object
 * @param {String} str - Some id to find the user with
 * @return {*} Returns the user object if found else returns false
 */
exports.findUser = (msg, str) => {
    if (!str || str === '') return false;
    const guild = msg.channel.guild;
    if (!guild) return msg.mentions[0] ? msg.mentions[0] : false;
    if (str.isValidID || /^<@!?\d{17,18}>/.test(str)) {
        const member = guild.members.get(/^<@!?\d{17,18}>/.test(str) ? str.replace(/<@!?/, '').replace('>', '') : str);
        return member ? member.user : false;
    } else if (str.length <= 33) {
        const isMemberName = (name, str) => name === str || name.startsWith(str) || name.includes(str);
        const member = guild.members.find((m) => {
            if (m.nick && isMemberName(m.nick.toLowerCase(), str.toLowerCase())) return true;
            return isMemberName(m.user.username.toLowerCase(), str.toLowerCase());
        });
        return member ? member.user : false;
    } else return false;
};

/**
 * Find a user's member object for that guild
 * @param {Object} msg - The message object
 * @param {String} str - The user's id
 * @return {*} Returns the member object if found else returns false
 */
exports.findMember = (msg, str) => {
    if (!str || str === '') return false;
    const guild = msg.channel.guild;
    if (!guild) return msg.mentions[0] ? msg.mentions[0] : false;
    if (str.isValidID || /^<@!?\d{17,18}>/.test(str)) {
        const member = guild.members.get(/^<@!?\d{17,18}>/.test(str) ? str.replace(/<@!?/, '').replace('>', '') : str);
        return member ? member : false;
    } else if (str.length <= 33) {
        const isMemberName = (name, str) => name === str || name.startsWith(str) || name.includes(str);
        const member = guild.members.find((m) => {
            if (m.nick && isMemberName(m.nick.toLowerCase(), str.toLowerCase())) return true;
            return isMemberName(m.user.username.toLowerCase(), str.toLowerCase());
        });
        return member ? member : false;
    } else return false;
};

/**
 * Update the guild count on bots.discord.pw
 * @param {Object} jeanne - The bot client
 * @param {String} id - The bot's id
 * @param {String} key - The bots.pw api key
 * @param {Number} server_count - The bot's guild count
 */
exports.updateAbalBots = (jeanne, id, key, server_count) => {
    if (!key || !server_count) return;
    axios.post(`https://bots.discord.pw/api/bots/${id}/stats`, {
        server_count
    }, {
        headers: {
            'Authorization': key,
            'User-Agent': jeanne.userAgent
        }
    }).then((res) => {
        if (res.status !== 200) return logger.error(chalk.red.bold(`[ABAL BOT LIST UPDATE ERROR] ${res.status || res.data}`));
        logger.debug(chalk.blue.bold(`[ABAL BOT LIST UPDATE] Updated bot server count to ${server_count}`));
    }).catch((err) => logger.error(chalk.red.bold(`[ABAL BOT LIST UPDATE ERROR] ${err}\n${JSON.stringify(err.response.data)}`)));
};

/**
 * Update the guild/shard count on discordbots.org
 * @param {Object} jeanne - The bot client
 * @param {String} id - The bot's id
 * @param {String} key - The bots.org api key
 * @param {Number} server_count - The bot's guild count
 * @param {Number} shard_count - The bot's shard count
 */
exports.updateDiscordBots = (jeanne, id, key, server_count, shard_count) => {
    if (!key || !server_count) return;
    axios.post(`https://discordbots.org/api/bots/${id}/stats`, {
        server_count,
        shard_count
    }, {
        headers: {
            'Authorization': key,
            'User-Agent': jeanne.userAgent
        }
    }).then((res) => {
        if (res.status !== 200) return logger.error(chalk.red.bold(`[BOTS .ORG LIST UPDATE ERROR] ${res.status || res.data}`));
        logger.debug(chalk.blue.bold(`[BOTS .ORG LIST UPDATE] Updated bot server count to ${server_count}`));
    }).catch((err) => logger.error(chalk.red.bold(`[BOTS .ORG LIST UPDATE ERROR] ${err}\n${JSON.stringify(err.response.data)}`)));
};

/**
 * Sets the bot's avatar
 * @param {Object} jeanne - The bot client
 * @param {String} url - The avatar to set
 * @return {Promise<any>} The result
 */
exports.setAvatar = (jeanne, url) => {
    return new Promise((resolve, reject) => {
        if (!!jeanne && typeof url === 'string') {
            axios.get(url, {
                headers: {
                    'User-Agent': jeanne.userAgent
                },
                responseType: 'arraybuffer'
            }).then((res) => {
                if (res.status === 200) {
                    jeanne.editSelf({
                        avatar: `data:${res.headers['content-type']};base64,${res.data.toString('base64')}`
                    }).then(resolve)
                        .catch(reject);
                } else {
                    reject('Got status code ' + res.status || res.data);
                }
            }).catch((err) => reject(err.response.data.status + ', ' + err.response.data.message));
        } else {
            reject('Invalid parameters');
        }
    });
};

/**
 * Format milliseconds to human readable time
 * @param {Number} milliseconds - The number to format
 * @return {String}
 */
exports.formatTime = (milliseconds) => {
    let daysText = 'days';
    let hoursText = 'hours';
    let minutesText = 'minutes';
    let secondsText = 'seconds';

    let s = milliseconds / 1000;
    let seconds = (s % 60).toFixed(0);
    s /= 60;
    let minutes = (s % 60).toFixed(0);
    s /= 60;
    let hours = (s % 24).toFixed(0);
    s /= 24;
    let days = s.toFixed(0);

    if (days === 1) daysText = 'day';
    if (hours === 1) hoursText = 'hour';
    if (minutes === 1) minutesText = 'minute';
    if (seconds === 1) secondsText = 'second';

    return `${days} ${daysText}, ${hours} ${hoursText}, ${minutes} ${minutesText}, and ${seconds} ${secondsText}`;
};

/**
 * Formats seconds to human readable time
 * @param {Number} time - The number to format
 * @return {String}
 */
exports.formatSeconds = (time) => {
    let days = Math.floor((time % 31536000) / 86400);
    let hours = Math.floor(((time % 31536000) % 86400) / 3600);
    let minutes = Math.floor((((time % 31536000) % 86400) % 3600) / 60);
    let seconds = Math.round((((time % 31536000) % 86400) % 3600) % 60);
    days = days > 9 ? days : days;
    hours = hours > 9 ? hours : hours;
    minutes = minutes > 9 ? minutes : minutes;
    seconds = seconds > 9 ? seconds : seconds;
    return `${days} Days, ${hours} Hours, ${minutes} Minutes and ${seconds} Seconds`;
};

/**
 * Format the time returned by the spotify command
 * @param {Number} milliseconds - The number to format
 * @return {String}
 */
exports.formatTimeForSpotify = (milliseconds) => {
    let s = milliseconds / 1000;
    let seconds = (s % 60).toFixed(0);
    s /= 60;
    let minutes = (s % 60).toFixed(0);

    return `${minutes}:${seconds}`;
};

/**
 * Formats the time returned from the youtube commands
 * @param {Number} time - The number to format
 * @return {String}
 */
exports.formatYTSeconds = (time) => {
    let hoursText = 'hours';
    let minutesText = 'minutes';
    let secondsText = 'seconds';

    let hours = Math.floor(((time % 31536000) % 86400) / 3600);
    let minutes = Math.floor((((time % 31536000) % 86400) % 3600) / 60);
    let seconds = Math.round((((time % 31536000) % 86400) % 3600) % 60);
    hours = hours > 9 ? hours : hours;
    minutes = minutes > 9 ? minutes : minutes;
    seconds = seconds > 9 ? seconds : seconds;
    if (hours === 1) hoursText = 'hour';
    if (minutes === 1) minutesText = 'minute';
    if (seconds === 1) secondsText = 'second';

    return `${hours} ${hoursText}, ${minutes} ${minutesText} and ${seconds} ${secondsText}`;
};

/**
 * Gets a random number between the specified min-max
 * @param {Number} min - Min number to get from
 * @param {Number} max - Max number to get from
 * @return {Number} Return a random number
 */
exports.getRandomInt = (min, max) => {
    let prev;
    return function rand() {
        const num = Math.floor((Math.random() * (max - min + 1)) + min);
        prev = (num === prev && min !== max) ? rand() : num;
        return prev;
    };
};

/**
 * Sort an array or object however you want
 * @param {Object} obj - The stuff to sort
 * @param sortedBy
 * @param isNumericSort
 * @param {Boolean} reverse
 * @return {Array}
 */
exports.sortProperties = (obj, sortedBy, isNumericSort, reverse) => {
    sortedBy = sortedBy || 1;
    isNumericSort = isNumericSort || false;
    reverse = reverse || false;

    let reversed = (reverse) ? -1 : 1;

    let sortable = [];
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            sortable.push([key, obj[key]]);
        }
    }
    if (isNumericSort) {
        sortable.sort(function (a, b) {
            return reversed * (a[1][sortedBy] - b[1][sortedBy]);
        });
    } else {
        sortable.sort(function (a, b) {
            let x = a[1][sortedBy].toLowerCase(),
                y = b[1][sortedBy].toLowerCase();
            return x < y ? reversed * -1 : x > y ? reversed : 0;
        });
    }
    return sortable;
};

/**
 * Executes the error webhook in my private guild
 * @param {Object} jeanne - The bot client
 * @param {Error} error - The error to handle
 * @param {String} type - The type of "error", can be WARN or ERROR
 */
exports.errorWebhook = (jeanne, error, type) => {
    if (type === 'WARN') {
        jeanne.executeWebhook(config.webhooks.errorID, config.webhooks.errorToken, {
            embeds: [{
                title: 'WARNING',
                color: config.colours.yellow,
                description: `**${new Date().toLocaleString()}**\n\n${error}`,
            }],
            username: `${jeanne.user.username}`,
            avatarURL: `${jeanne.user.dynamicAvatarURL('png', 2048)}`
        }).catch((err) => {
            logger.error(chalk.red.bold(err));
        });
    } else if (type === 'ERROR') {
        jeanne.executeWebhook(config.webhooks.errorID, config.webhooks.errorToken, {
            embeds: [{
                title: 'ERROR',
                color: config.colours.red,
                description: `**${new Date().toLocaleString()}**\n\n${error.stack ? error.stack : ''}${!error.stack ? error : ''}`,
            }],
            username: `${jeanne.user ? jeanne.user.username : 'Jeanne d\'Arc'}`,
            avatarURL: `${jeanne.user ? jeanne.user.dynamicAvatarURL('png', 2048) : 'https://b.catgirlsare.sexy/d1mh.png'}`
        }).catch((err) => {
            logger.error(chalk.red.bold(err));
        });
    }
};

/**
 * Round a number with the specified precision
 * @param {Number} value - The value to round
 * @param {Number} precision - The precision to round
 * @return {Number} The rounded value
 */
exports.round = (value, precision) => {
    let multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

/**
 * Get the highest role colour if one exits else return 15277667 as defautl colour
 * @param {Object} obj - The message or guild object depending on if guild is true or false
 * @param {Object} jeanne - The client object
 * @param {Boolean} guild - Wether obj is a guild object or not, defaults to false
 * @returns {Number} The colour
 */
exports.getDefaultColor = (obj, jeanne, guild = false) => {
    let user;
    if (guild) user = obj.members.get(jeanne.user.id);
    else user = obj.channel.guild.members.get(jeanne.user.id);

    if (user.roles.length >= 1) {
        if (user.highestRole.color === 0) return 15277667;
        else return user.highestRole.color;
    } else return 15277667
};

/**
 *
 * @param {Object} a - The stuff to filter
 * @returns {Object} The filtered object
 */
exports.unique = (a) => {
    let prims = {'boolean': {}, 'number': {}, 'string': {}}, objs = [];
    return a.filter(function (item) {
        let type = typeof item;
        if (type in prims) {
            return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
        } else {
            return objs.indexOf(item) >= 0 ? false : objs.push(item);
        }
    });
};

/**
 * Checks if the user as all the permissions from the specified array
 * @param {Object} channel - The channel object
 * @param {Object} user - The user's object
 * @param {Array} perms - An array of permissions
 * @return {Boolean}
 */
exports.hasPermissions = (channel, user, ...perms) => {
    const member = channel.guild.members.get(user.id);
    for (let perm of perms) {
        if (!member.permission.has(perm)) return false;
    }
    return true;
};

/**
 * Probably not best practice but just to make me have to do less later on owo
 */
Object.defineProperty(String.prototype, 'isValidID', {
    get: function () { // Do not make arrow function!
        return /^\d{17,18}$/.test(this);
    }
});

/**
 * Why?? you may ask, simple, because toString() looks ugly lul
 * @param arg
 * @return {string}
 */
global.string = (arg) => {
    return arg.toString()
};

/**
 * Don't even ask. I know what I'm doing Kappa
 * @param arg
 * @return {number}
 */
global.number = (arg) => {
    return parseInt(arg)
};

/**
 * Reverse a string of ascii art
 * @param {String} art - The string to reverse
 * @return {*}
 */
exports.reverse = (art) => {
    let newArt = art.replace('\r\n', '\n')
        .split('\n');

    const maxLineLen = newArt.reduce((max, line) => {
        return Math.max(line.length, max);
    }, 0);
    newArt = newArt.map((line) => {
        const pad = (new Array(1 + maxLineLen - line.length)).join(' ');
        const art = line + pad;
        let rev = '';
        for (let i = art.length - 1; i >= 0; --i) {
            if (opposites.hasOwnProperty(art[i])) {
                rev += opposites[art[i]];
            } else {
                rev += art[i];
            }
        }
        line = rev;
        return line.replace(/\s\+$/, '');
    }).join('\n');
    return newArt;
};

/**
 * Get the YouTube video ID from a url or string.
 * Original code from https://github.com/remarkablemark/youtube-video-id
 * @param  {String} string - The url or string.
 * @return {Promise<String>} - The video ID.
 */
exports.getYouTubeVideoId = (string) => {
    const regex = /(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    return new Promise((resolve, reject) => {
        if (typeof string !== 'string') {
            return reject(new TypeError('First argument must be a string.'));
        }
        const match = string.match(regex);
        if (match && match.length > 1) {
            return resolve(match[2]);
        }
        return resolve(string);
    });
};
