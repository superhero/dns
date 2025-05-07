import net    from 'net'
import reply  from './reply.js'

export default net.createServer(socket => 
{
  socket.on('error', error => console.error('socket error:', error))
  socket.on('data',  async chunk => 
  {
    try
    {
      const 
        length    = chunk.readUInt16BE(0),
        encoded   = chunk.subarray(2, 2 + length),
        response  = await reply(encoded),
        buffer    = Buffer.alloc(response.length + 2)
  
      buffer.writeUInt16BE(response.length, 0)
      response.copy(buffer, 2)
  
      socket.write(buffer)
      socket.end()
    }
    catch(error)
    {
      socket.destroy(error)
    }
  })
})
