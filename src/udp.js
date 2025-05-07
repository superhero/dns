import dgram  from 'dgram'
import reply  from './reply.js'

const server = dgram.createSocket('udp4')
server.on('error',         (error)            => console.error('socket error:', error))
server.on('message', async (encoded, remote)  => 
{
  try
  {
    const response = await reply(encoded)
    server.send(response, 0, response.length, remote.port, remote.address)
  }
  catch(error)
  {
    console.error('socket error:', error)
  }
})

export default server