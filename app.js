const axios = require('axios');
const cheerio = require('cheerio');

const url = process.argv.slice(2)[0]

const getQuery = (url = '') => {
  const format = url.split('?page=')
  return format[0]
}

const parseParsePage = async (url, page = 1) => {
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
        const link = postItem.attr("href").trim()
        result.push({ title, link })
    });

  if (!paginationItem.children()
    || (paginationItem.children().length - 2) <= page) return result

  const nextPage = await parseParsePage(`${getQuery(url)}?page=${page + 1}`, page + 1)
  return [...result, ...nextPage]
}

const main = async () => {
  const pageList = await parseParsePage(url)
  console.log(pageList);
}

main()
