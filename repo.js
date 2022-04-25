const knex = require('./db');
const R = require('ramda');
const names = require('./mock_names.json');
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
        const session = await getCurrentSession();
        const group_size = session.group_size;
        const players = await knex.select('first_name').from('player')
            .innerJoin('play', 'player.id', 'play.player_id').where({session_id: session.id});
        players.push(...names);
        let reply = `\nSlots - ${group_size}\nPlaying\n`;
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
        return ctx.reply(reply);
    } catch (e) {
        const message = e.message;
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }
}
const session = async (ctx) => {
    try {
        const telegram_id = ctx?.update?.message?.from?.id;
        let player =  R.head(await knex.select().table('Player').where({telegram_id}))
        const isAdmin = player?.is_admin;

        if(R.isNil(player) || isAdmin!=true){
            return ctx.reply(`You need to be an admin to start a new session.`);
        } 

        const ToDbSession = {
            creater_id : player.id,
        }
        await knex('Session').insert(ToDbSession);

        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date+' '+time;
        return ctx.reply(`New session started from time - ${dateTime}. Each session is valid for 24 hours.`)
    } catch (e) {
        const message = e.message;
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }
};

// const setSize = async (ctx)

const register =  async (ctx) => {
    try {
        const telegram_id = ctx?.update?.message?.from?.id;
        let player =  R.head(await knex.select().table('Player').where({telegram_id}))

        if(R.isNil(player)){
            const ToDbPlayer = {
                first_name: ctx.update.message.from.first_name,
                last_name: ctx.update.message.from.last_name || null,
                telegram_id: ctx.update.message.from.id
            }
            player = await knex('Player').insert(ToDbPlayer);
        }

        const session = await getCurrentSession();
        if(R.isNil(session)){
            return ctx.reply('Currently there are no registerations is progress');
        }

        const playForPlayer = R.head(await knex().select().table('Play').where({player_id: player?.id, session_id: session?.id}));
        if(!R.isNil(playForPlayer)){
            return ctx.reply('You are already reigstered for this session.')
        }

        const ToDbPlay = {
            player_id: player?.id,
            session_id: session?.id,
        }
        await await knex('Play').insert(ToDbPlay);
        return ctx.reply(`${ctx.update.message.from.first_name} Reigstered`)
    } catch (e) {
        const message = e.message;
        console.error(message);
        return ctx.reply(`Unable to register due to internal error. Please contact administrator`);
    }

}

const getCurrentSession = async () => {
    return R.head(await knex().select().table('Session').orderBy('id', 'desc').limit(1));
}


const isAdmin = async (ctx) => {
    const telegram_id = ctx?.update?.message?.from?.id;
    let player =  R.head(await knex.select().table('Player').where({telegram_id}))
    return player.is_admin==true;
}

module.exports.register = register;
module.exports.session = session;
module.exports.list = list;
module.exports.size = size;