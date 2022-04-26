const knex = require('./db');
const R = require('ramda');
const names = require('./mock_names.json');
const moment = require('moment');
const { isNumber } = require('util');

const size = async (ctx) => {
    try {
        if(!isAdmin(ctx)){
            return ctx.reply('You need to be an admin to set group size.')
        }
        const message = ctx?.update?.message?.text;
        const split = message.split(/\s+/);
        if(split.length != 2){
            return ctx.reply('Please provide an argument of the format - [/size number]')
        }
        const num_people = Number(split[1]); 
        if(!Number.isInteger(num_people)){
            return ctx.reply('Size must be an integer.')
        }
        const session = await getCurrentSession();

        if(R.isNil(session)){
            return ctx.reply('There are currently no active sessions.');
        }

       const update = await knex('session')
       .where({ id: session?.id })
       .update({ group_size: num_people }, ['group_size'])
        
       return ctx.reply(`Updated group to - ${num_people}`);
    } catch (e) {
        const message = e.message;
        return ctx.reply(`Unable to register due to internal error. Please contact administrator.`);
    }
}
const list = async (ctx) => {
    try {
        const message = ctx?.update?.message?.text;
        const split = message.split(/\s+/);
        const needs_history = split.length > 1;

        if(split.length > 2 || (needs_history && !Number.isInteger(Number(split[1])))){
            return ctx.reply('Please provide an argument of the format - [/list integer?]')
        }

        let reply = '';
        let sessions = [];


        if(!needs_history){
            sessions = [await getCurrentSession()];
        } else {
            const history_length = Number(split[1]);
            sessions = await knex().select().table('session').orderBy('id', 'desc').limit(history_length);
        }

        for(const session of sessions){
            reply += await formatList(session);
            reply += '\r\n\r\n';
        };

        return ctx.reply(reply);
    } catch (e) {
        const message = e.message;
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }
}
const session = async (ctx) => {
    try {
        const telegram_id = ctx?.update?.message?.from?.id;
        let player =  R.head(await knex.select().table('player').where({telegram_id}))
        const isAdmin = player?.is_admin;

        if(R.isNil(player) || isAdmin!=true){
            return ctx.reply(`You need to be an admin to start a new session.`);
        } 

        const ToDbSession = {
            creater_id : player.id,
        }
        await knex('session').insert(ToDbSession);
        const date_str = moment(new Date()).format('MMMM Do YYYY');
        return ctx.reply(`New session started from - ${date_str}. Each session is valid for 24 hours.`)
    } catch (e) {
        const message = e.message;
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }
};

// const setSize = async (ctx)

const leave =  async (ctx) => {
    try {
        const telegram_id = ctx?.update?.message?.from?.id;
        let player =  R.head(await knex.select().table('player').where({telegram_id}))

        const session = await getCurrentSession();
        if(R.isNil(session)){
            return ctx.reply('Currently there are no registerations is progress');
        }

        const playForPlayer = R.head(await knex().select().table('play').where({player_id: player?.id, session_id: session?.id}));
        if(R.isNil(playForPlayer)){
            return ctx.reply('You are not registered for this play.')
        }
        await await knex('play').where({id: playForPlayer.id}).del();
        return ctx.reply(`${ctx.update.message.from.first_name} removed from play.`)
    } catch (e) {
        const message = e.message;
        console.error(message);
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }

}

const join =  async (ctx) => {
    try {
        const telegram_id = ctx?.update?.message?.from?.id;
        let player =  R.head(await knex.select().table('player').where({telegram_id}))

        const session = await getCurrentSession();
        if(R.isNil(session)){
            return ctx.reply('Currently there are no registerations is progress');
        }

        const playForPlayer = R.head(await knex().select().table('play').where({player_id: player?.id, session_id: session?.id}));
        if(!R.isNil(playForPlayer)){
            return ctx.reply('You are already reigstered for this session.')
        }

        const ToDbPlay = {
            player_id: player?.id,
            session_id: session?.id,
        }
        await await knex('play').insert(ToDbPlay);
        return ctx.reply(`${ctx.update.message.from.first_name} joined the play.`)
    } catch (e) {
        const message = e.message;
        console.error(message);
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }

}

const addPlayerIfNew = async (ctx) => {
    try {
        const telegram_id = ctx?.update?.message?.from?.id;
        let player =  R.head(await knex.select().table('player').where({telegram_id}))

        if(R.isNil(player)){
            const ToDbPlayer = {
                first_name: ctx.update.message.from.first_name,
                last_name: ctx.update.message.from.last_name || null,
                telegram_id: ctx.update.message.from.id
            }
            player = await knex('player').insert(ToDbPlayer);
        }
    } catch (e) {
        const message = e.message;
        console.error(message);
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }
}

const formatList = async (session) => {
    if(R.isNil(session)){
        return 'Session not found';
    }
    const group_size = session.group_size;
    const players = await knex.select('first_name').from('player')
        .innerJoin('play', 'player.id', 'play.player_id').where({session_id: session.id});
    players.push(...names);
    const date_str = moment(session.created_at).format('MMMM Do YYYY');
    let reply = `${date_str}\nSlots - ${group_size}\nPlaying\n`;
    const playing_players = players.slice(0, group_size);
    const wl_players = players.slice(group_size);
    playing_players.forEach((player, i) => {
        reply += `${i+1}. ${player.first_name} \n`
    })
    if(wl_players.length > 0){
        reply += `\nWaitlist\n`
        wl_players.forEach((player, i) => {
            reply += `${i+1}. ${player.first_name} \n`
        }) 
    }
    return reply;
}

const getCurrentSession = async () => {
    return R.head(await knex().select().table('session').orderBy('id', 'desc').limit(1));
}

const isAdmin = async (ctx) => {
    const telegram_id = ctx?.update?.message?.from?.id;
    let player =  R.head(await knex.select().table('player').where({telegram_id}))
    return player.is_admin==true;
}

module.exports = {
    join,
    session,
    list,
    size,
    addPlayerIfNew,
    leave,
}