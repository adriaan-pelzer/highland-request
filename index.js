const H = require('highland');
const request = require('request');

const requestWrapped = ( options, retries ) => H.wrapCallback(request)(options)
    .flatMap ( ( { statusCode, body } ) => H ( ( push, next ) => {
        const r = retries || 0;

        if ( statusCode !== 200 && statusCode !== 201 ) {
            if ( r > 3 ) {
                push ( [
                    `${options.method || 'GET'} ${options.url} ERROR: HTTP code ${statusCode}`,
                    typeof ( body ) === 'string' || typeof ( body ) === 'number' ? body : JSON.stringify ( body, null, 4 )
                ].join ( "\n" ) );
                return push ( null, H.nil );
            }

            return setTimeout ( () => next ( requestWrapped ( options, r + 1 ) ), ( r + 1 ) * 100 );
        }

        push ( null, body );
        return push ( null, H.nil );
    } ) );

module.exports = requestWrapped;
