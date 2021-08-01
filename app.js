const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config.json')

const getQuery = (url = '') => {
  const format = url.split('?page=')
  return format[0]
}

const parseParsePage = async (url, tags, page = 1) => {
  const result = [];
  if (!url) return result;

  let res = await axios(url).catch((err) => console.log(err));
  
  if(res.status !== 200){
      console.log(`fetch error, page ${url}`);
      return result;
  }

  const html = res.data;
  const $ = cheerio.load(html);
  const paginationItem = $('.pagination')


  const statsTable = $('.ir-profile-content').find('.qa-list', '.profile-list', 'ir-profile-list');
    statsTable.each(function() {
        let postItem = $(this)
          .children('.profile-list__content')
          .children('.qa-list__title')
          .children('.qa-list__title-link')


        const title = postItem.text().trim()
        const url = postItem.attr("href").trim()
        result.push({
          action : 'add',
          title,
          url,
          tags
        })
    });

  if (!paginationItem.children()
    || (paginationItem.children().length - 2) <= page) return result

  const nextPage = await parseParsePage(`${getQuery(url)}?page=${page + 1}`, tags, page + 1)
  return [...result, ...nextPage]
}

const main = async () => {
  const [url, tags = ''] = process.argv.slice(2)

  if (!config.pocket.consumer_key || !config.pocket.access_token) {
    console.log('pocket key not set!');
    return;
  }

  const pageList = await parseParsePage(url, tags)

  const pocketResponse = await axios.post('https://getpocket.com/v3/send', {
    consumer_key: config.pocket.consumer_key,
    access_token: config.pocket.access_token,
    actions: pageList
  })


  if (!pocketResponse) {
    console.log(pocketResponse);
    return
  }

  console.log('Pocket List:');
  console.log('==============================');
  pocketResponse.data.action_results.forEach(result => {
    console.log(`${result.title}: https://getpocket.com/read/${result.item_id}`);
  });

  console.log();
  console.log('action_errors');
  console.log('==============================');
  console.log(pocketResponse.data.action_errors);
}

main()
