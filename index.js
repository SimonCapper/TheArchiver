// <=== ENVIRONMENTAL VARIABLE SETUP ===>
const dotenv = require( "dotenv" );
dotenv.config();
// <=== CLASS DEFINITIONS ===>
// <=== TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER === TWITTER ===>
class TwitterAPI {
    // constructor takes necessary keys and tokens from the user and logs them into the client; it also established a varaible regulating the opening of the data stream 
    constructor( CONSUMER_KEY, CONSUMER_SECRET, BEARER_TOKEN ) {
        const Twitter = require( "twitter-v2" );
        this.client = new Twitter({
            consumer_key: CONSUMER_KEY,
            consumer_secret: CONSUMER_SECRET,
            bearer_token: BEARER_TOKEN
        });
        this.stream = null;
        this.url_path;
        this.url_parameters;
        this.is_connected = false;
    }
    async get_rules() {
        console.log( "Getting rules..." );
        return await this.client.get( "tweets/search/stream/rules" );
    }
    post_rules( rules ) {
        console.log( "Posting rules..." );
        this.client.post( "tweets/search/stream/rules", rules ).then();
    }
    // "connects" to the stream, saves input arguments from the user, allows stream_data to execute
    stream_connect( url_path, url_parameters ) {
        console.log( "Connecting stream..." );
        this.stream = this.client.stream( url_path, url_parameters );
        this.url_path = url_path;
        this.url_parameters = url_parameters;
        this.is_connected = true;
        console.log( "Stream connected!" );
    }
    // starts the stream of tweets from specific users, and when it receives a tweet, it tells the database to update
    async stream_data( send_tweet_to_database, database_object, print_option ) {
        if( !( this.is_connected ) ) return 1;
        console.log( "Streaming data..." );
        for await ( const tweet_object of this.stream ) {
            if( !( this.is_connected ) ) return 1;
            if( "data" in tweet_object ) {
                send_tweet_to_database( tweet_object, database_object );
                print_option( tweet_object );
                console.log( tweet_object.includes.users[ 0 ].name + "\n@" + tweet_object.includes.users[ 0 ].username + "\nTweet ID: " + tweet_object.data.id
                                                    + "\nURL: https://twitter.com/" + tweet_object.includes.users[ 0 ].username + "/status/"
                                                    + tweet_object.data.id + "\n" + "Date: " + tweet_object.data.created_at + "\nTweet:\n"
                                                    + `${tweet_object.data.text.replace(/\s/g, ' ')}` + "\n" );
            } else {
                this.stream_reconnect();
            }
        }
    }
    // reconnects the stream by running the series: close, connect, stream
    stream_reconnect() {
        console.log( "Restarting stream..." );
        this.stream_close();
        this.stream_connect( this.url_path, this.url_parameters );
        this.stream_data();
    }
    stream_close() {
        console.log( "Closing stream..." );
        this.isConnected = false;
        this.stream.close();
        this.stream = null;
        console.log( "Stream closed!" );
    }
}
// <=== DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD === DISCORD ===>
class DiscordAPI {
    constructor( TOKEN, channel_id ) {
        this.Discord = require( "discord.js" );
        this.client = new this.Discord.Client();
        this.client.login( TOKEN );
        this.client.once( "ready", () => {
            console.log( "Discord startup complete!" );
        });
        this.channel_id = channel_id;
    }
    respond_to_messages( interactions ) {
        this.client.on( "message", interactions );
    }
    print_embed( tweet ) {
        const embed_version = {
        "title": "**" + tweet.includes.users[ 0 ].name + "**",
        "description": "``@" + tweet.includes.users[ 0 ].username + "``\n\nTweet ID: [" + tweet.data.id + "](https://twitter.com/"
                             + tweet.includes.users[ 0 ].username + "/status/" + tweet.data.id + ")",
        "url": "https://twitter.com/" + tweet.includes.users[ 0 ].username,
        "color": 1942002,
        "timestamp": tweet.data.created_at,
        "fields": [
            {
            "name": "Tweet:",
            "value": `${tweet.data.text.replace(/\s/g, ' ')}`,
            }
        ]};
        const embed_message = new Discord_object.Discord.MessageEmbed();
        const channel = Discord_object.client.channels.cache.get( Discord_object.channel_id );
        channel.send( { embed: embed_version } );
    }
}
// <=== MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB === MONGODB ===>
class MongoDB {
    constructor( URI ) {
        const { MongoClient } = require( "mongodb" );
        this.client = new MongoClient( URI );
        this.database;
        this.collection;
    }
    connect_to_collection( database_name, collection_name ) {
        console.log( "Connecting to " + collection_name + " within " + database_name + " database..." );
        this.client.connect().then( () => {
            this.database = this.client.db( database_name );
            this.collection = this.database.collection( collection_name );
        });
        console.log( "Connected to " + collection_name + " within " + database_name + "!" );
    }
    static dump_to_collection( object_to_dump, meta_mongo_object ) {
        meta_mongo_object.collection.insertOne( object_to_dump ).then( result => {
            console.log( `Dumped ${result.insertedCount} object with the _id: ${result.insertedId}` );
        });
    }
    async filter_collection( filter_paper ) {
        let objects = this.collection.find( filter_paper );
        return await objects.toArray();
    }
    disconnect() {
        this.client.close().then( () => {
            console.log( "Disconnected from database!" );
        });
    }
}
// SETUP & AUTHENTICATION
let Discord_object = new DiscordAPI( process.env.DISCORD_TOKEN, "813922005396094996" );
let Twitter_object = new TwitterAPI( process.env.CONSUMER_KEY, process.env.CONSUMER_SECRET, process.env.BEARER_TOKEN );
let Mongo_object = new MongoDB( "mongodb://localhost:27017" );
Mongo_object.connect_to_collection( "test_1", "all_tweets" );
// MAIN EXECUTION
Discord_object.respond_to_messages( message => {
    if( message.content === "!fish" ) {
        message.channel.send( "https://media.discordapp.net/attachments/644755612613214219/750430490992836740/tenor_3.gif" );
    }
    if( message.content === "!showrules" ) {
        Twitter_object.get_rules().then( rules => {
        message.channel.send( "Current rules:\n" + JSON.stringify( rules ) );
        console.log( "Current rules:" );
        console.log( rules );
        });
    }
    if( message.content.startsWith( "!addusers" ) ) {
        const args = message.content.slice( "!addusers".length ).trim().split( " " );
        let new_users = [];
        for( let username of args ) new_users.push( { value: "from:" + username } );
        Twitter_object.post_rules( { add: new_users } );
        console.log( "Added users " + args.join( " " ) );
    }
    if( message.content.startsWith( "!removeusers" ) ) {
        const args = message.content.slice( "!removeusers".length ).trim().split( " " );
        Twitter_object.post_rules( { delete: { ids: args } } );
        message.channel.send( "Removed users " + args.join( " " ) );
        console.log( "Removed users " + args.join( " " ) );
        
    }
    if ( message.content === "!stream connect" ) {
        Twitter_object.stream_connect( "tweets/search/stream", { expansions: "author_id", "tweet.fields": "created_at" } );
    }
    if( message.content === "!stream data" ) {
        Twitter_object.stream_data( MongoDB.dump_to_collection, Mongo_object, Discord_object.print_embed );
    }
    if( message.content === "!stream close" ) {
        Twitter_object.stream_close();
    }
    // if( message.content.startsWith( "!checktweets" ) ) {
    //     const args = message.content.slice( "!checktweets".length ).trim().split( " " );
    //     clientTwitter.get( "tweets", { ids: args } ).then( czech => { tell( JSON.stringify( czech ), message ) } );
    // }
    if( message.content.startsWith( "!gettweetsfrom" ) ) {
        const args = message.content.slice( "!gettweetsfrom".length ).trim().split( " " );
        Mongo_object.filter_collection( { "includes.users.0.username": args[ 0 ] } ).then( tweets => { console.log( tweets ) } );
    }
    if( message.content === "!help" ) {
        message.channel.send( ">>> __List of available commands:__\n!fish\n!showrules\n!addusers user1, user2, ...\
                               \n!removeusers userid1, userid2, ...\n!stream connect\n!stream data\n!stream close\n!gettweetsfrom\n" );
    }
});

function printTweet( tweet, message ) {
    // send in the console
    console.log( tweet.includes.users[ 0 ].name + "\n@" + tweet.includes.users[ 0 ].username + "\nTweet ID: " + tweet.data.id
                                                + "\nURL: https://twitter.com/" + tweet.includes.users[ 0 ].username + "/status/"
                                                + tweet.data.id + "\n" + "Date: " + tweet.data.created_at + "\nTweet:\n"
                                                + `${tweet.data.text.replace(/\s/g, ' ')}` + "\n" );
    // send in discord
    const embed = {
    "title": "**" + tweet.includes.users[ 0 ].name + "**",
    "description": "``@" + tweet.includes.users[ 0 ].username + "``\n\nTweet ID: [" + tweet.data.id + "](https://twitter.com/"
                         + tweet.includes.users[ 0 ].username + "/status/" + tweet.data.id + ")",
    "url": "https://twitter.com/" + tweet.includes.users[ 0 ].username,
    "color": 1942002,
    "timestamp": tweet.data.created_at,
    "fields": [
        {
        // "name": "Tweet ID: " + tweet.data.id,
        "name": "Tweet:",
        "value": `${tweet.data.text.replace(/\s/g, ' ')}`,
        // "value": "URL: https://twitter.com/" + tweet.includes.users[ 0 ].username + "/status/" + tweet.data.id
        }
    ]};
    message.channel.send( { embed } );
}
