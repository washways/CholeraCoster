addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Simple forwarder to World Bank API that adds CORS headers.
 * It strips any leading slashes in the path param.
 * Example: request to https://<worker>/country/MWI/indicator/SP.POP.TOTL?format=json
 * will be proxied to https://api.worldbank.org/v2/country/MWI/indicator/SP.POP.TOTL
 */
async function handleRequest(request) {
  // build target from path
  const url = new URL(request.url)
  // path after host
  let path = url.pathname
  // remove any leading / from path
  if (path.startsWith('/')) path = path.substring(1)
  const target = `https://api.worldbank.org/v2/${path}${url.search}`

  try {
    const resp = await fetch(target, { method: 'GET' })
    const headers = new Headers(resp.headers)
    // force JSON and add CORS
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')

    const body = await resp.arrayBuffer()
    return new Response(body, { status: resp.status, headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
