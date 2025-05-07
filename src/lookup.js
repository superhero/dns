import http from 'http'

const 
  SOCKET      = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock',
  disjunction = new Intl.ListFormat('en', { type: 'disjunction', style: 'long' })

export default (question) => new Promise((resolve, reject) =>
{
  const 
    filters = { 'service': { [question.name]:true }, 'desired-state': { "running":true } },
    options =
    {
      socketPath : SOCKET,
      path       : `/tasks?filters=${encodeURIComponent(JSON.stringify(filters))}`,
      method     : 'GET'
    }

  const request = http.request(options, result =>
  {
    if(200 !== result.statusCode)
    {
      const error = new Error(`Failed to lookup the ip for "${question.name}" using the docker unix socket`)
      error.code  = 'E_DNS_LOOKUP_UNIX_SOCKET_' + result.statusCode
      error.cause = `Docker API: ${result.statusMessage} [${result.statusCode}] ${decodeURIComponent(options.path)}`
      return request.destroy(error)
    }

    let data = ''
    result.on('data', (chunk) => data += chunk)
    result.on('end',  ()      =>
    {
      try
      {
        const tasks = JSON.parse(data)
        validateTasks(tasks)
        const addresses = extractAddresses(tasks)
        validateAddresses(addresses)
        console.log(`✔ ${question.name} → ${disjunction.format(addresses)}`)
        resolve({ question, addresses })
      }
      catch (reason)
      {
        const error = new Error(`Failed to parse the response for "${question.name}" from the docker unix socket`)
        error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE'
        error.cause = reason
        return reject(err)
      }
    })
    result.on('error', (reason) =>
    {
      const error = new Error(`Failed to lookup the ip for "${question.name}" using the docker unix socket`)
      error.code  = 'E_DNS_LOOKUP_UNIX_SOCKET'
      error.cause = reason
      reject(error)

      request.destroy()
    })
  })

  request.on('error', reject)
  request.end()
})

export function extractAddresses(tasks)
{
  const
    mapped    = tasks.map(task => task.NetworksAttachments.map(net => net.Addresses.map(addr => addr.split('/')[0]))),
    flatten   = mapped.flat(3),
    filtered  = flatten.filter(Boolean)

  return filtered
}

export function validateTasks(tasks)
{
  if(false === Array.isArray(tasks))
  {
    const error = new Error(`Unexpected response type from the docker unix socket`)
    error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE_TYPE'
    error.cause = `Expected type array, recieved: ${typeof tasks}`
    throw error
  }
  if(0 === tasks.length)
  {
    const error = new Error(`No tasks found`)
    error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE_EMPTY'
    error.cause = `Empty response`
    throw error
  }
  if(false === tasks.every(task => Array.isArray(task.NetworksAttachments)))
  {
    const error = new Error(`Unexpected type of networks attachments`)
    error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE_NETWORKS_MISSING'
    error.cause = `Expected type array`
    throw error
  }
  if(tasks.every(task => 0 === task.NetworksAttachments.length))
  {
    const error = new Error(`No networks found`)
    error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE_NETWORKS_EMPTY'
    error.cause = `Networks attachments is empty`
    throw error
  }
  if(tasks.some(task => task.NetworksAttachments.some(net => false === Array.isArray(net.Addresses))))
  {
    const error = new Error(`Unexpected type of addresses in the networks attachments`)
    error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE_NETWORKS_ADDRESSES_TYPE'
    throw error
  }
}

export function validateAddresses(addresses)
{
  if(0 === addresses.length)
  {
    const error = new Error(`No addresses found in the networks attachments after filtering`)
    error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE_NETWORKS_ADDRESSES_MISSING'
    throw error
  }
  if(false === addresses.every(addr => addr.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)))
  {
    const error = new Error(`Unexpected address format`)
    error.code  = 'E_DNS_LOOKUP_PARSE_RESPONSE_ADDRESS_FORMAT'
    error.cause = `Expected valid IP addresses`
    throw error
  }
}