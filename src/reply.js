import packet from 'dns-packet'
import lookup from './lookup.js'

import dns  from 'dns'
import { console } from 'inspector'

async function fallback(question, error)
{
  console.error('DNS lookup in the docker swarm failed')
  console.error(error)
  console.error('falling back to OS DNS resolver')

  await new Promise((resolve, reject) => dns.lookup(question.name, /* { all:true } */ (reason, address, family) => 
  {
    if(reason)
    {
      const error = new Error(`Failed to lookup the ip for "${question.name}" using the OS DNS resolver`)
      error.code  = 'E_DNS_LOOKUP_FALLBACK_OS'
      error.cause = reason
      reject(error)
    }
    else
    {
      console.log(`✔ ${question.name} → ${address} → usinfg the OS fallback`)
      resolve({ question, addresses:[address] })
    }
  }))
}


export default async (encoded) =>
{
  const
    request   = packet.decode(encoded),
    lookedup  = await Promise.all(request.questions.map(question => lookup(question).catch(fallback.bind(null, question)))),
    response  = packet.encode(
    {
      type      : 'response',
      id        : request.id,
      flags     : packet.RECURSION_DESIRED,
      questions : request.questions,
      answers   : lookedup.flat().map(({ question, addresses }) => addresses.map(address =>
      ({
        type  : question.type  ?? 'A',
        class : question.class ?? 'IN',
        name  : question.name,
        ttl   : 30,
        data  : address
      }))).flat()
    })

  return response
}
