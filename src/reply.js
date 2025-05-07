import packet from 'dns-packet'
import lookup from './lookup.js'

export default async (encoded) =>
{
  const
    request   = packet.decode(encoded),
    lookedup  = await Promise.all(request.questions.map(question => lookup(question))),
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
