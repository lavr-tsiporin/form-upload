const DELAY_BLOCK = 10 //s
let result = []
const controllerAbort = new AbortController()

const htmlElements = {
  user: document.querySelector('img.avatar'),
  root: document.querySelector('#addBlocking'),
  select: document.querySelector('select.form-control'),
  license: document.querySelector('textarea#keyField'),
  description: document.querySelector('textarea[name="description"]'),
  ticket: document.querySelector('input[name="ticket"]'),
  tillDate: document.querySelector('input[name="tillDate"]'),
  btnSubmit: document.querySelector('button[type="submit"]')
}

function CreateElement({ name, options, contents, events }) {
  const element = document.createElement(name)
  if (options !== undefined) {
    Object.keys(options).forEach((keyOption) => {
      element.setAttribute(keyOption, options[keyOption])
    })
  }
  if (contents !== undefined) {
    Object.keys(contents).forEach((keyContent) => {
      element[keyContent] = contents[keyContent]
    })
  }
  if (events !== undefined) {
    Object.keys(events).forEach((keyEvent) => {
      element.addEventListener(keyEvent, events[keyEvent])
    })
  }
  return element
}

function CreatePromise(callback, { signal = controllerAbort.signal, delay = 1 }) {
  if (signal.aborted) {
    console.error('Abort')
    return Promise.reject(new DOMException('Aborted', 'AbortError'))
  }

  return new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(new DOMException('Aborted', 'AbortError'))
    })
    setTimeout(() => {
      const condition = callback()
      if (condition === true) {
        resolve(condition)
      }
      reject(condition)
    }, delay * 1000)
  })
}

function formatFileInArray(str) {
  return str
    .split('@')
    .filter(el => el !== '')
    .map(el => el.split(';'))
    .map(el => ({
      license: el[0]
        .replace('\r', '')
        .replace('\n', '')
        .trim(),
      resolution: el[1]
        .replace(/^\"/g, '')
        .replace(/\"$/g, '')
        .replace(/\"\"/g, '"')
        .trim()
    }))
}

function formatDataInMassBlock(data) {
  return data.reduce((prev, next) => {
    /*
    {
      title: '',
      numbers: []
    }
     */
    if (prev.some((item) => item.title === next.resolution)) {
      const item = prev.find((i) => i.title === next.resolution)
      const r = item.numbers.push(next.license)
      if (typeof r !== 'object') {
        return prev
      }
      return [...prev, r]
    }
    prev.push({
      title: next.resolution,
      numbers: [next.license]
    })
    return prev
  }, [])
}

function formatDateInLocale() {
  return new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' })
}

function postMessageInTelegram(message=[]) {
  const user = htmlElements.user.getAttribute('src').match(/.+\/user\/(.+)\/avatar/)[1]
  window.open(`https://api.telegram.org/bot${API_KEY}/sendMessage?chat_id=${CHAT_ID}&text=\`WEB\` \*${user}\* ${message.join(`${"%0A"}`)}&parse_mode=Markdown`,
    "_blank", "resizable=no,top=10,left=300,width=100,height=100")
}

function switchMessageInLogger({ status, title = '', numbers = [] }) {
  switch (status) {
    case 'error':
      return {
        style: 'color: red;',
        message: `[${formatDateInLocale()}] Template: ${title} error. Total numbers: ${numbers.length}`
      }
    case 'block':
      return {
        style: 'color: black;',
        message: `[${formatDateInLocale()}] Template: ${title} Total numbers: ${numbers.length} block.`
      }
    case 'start':
      return {
        style: 'color: black;',
        message: `[${formatDateInLocale()}] start blocks. Total blocks: ${title}`
      }
    case 'finish':
      return {
        style: 'color: green;',
        message: `[${formatDateInLocale()}] finish blocks.`
      }
    case 'abort':
      return {
        style: 'color: red;',
        message: `[${formatDateInLocale()}] abort blocks.`
      }
    default:
      return {
        style: 'color: black;',
        message: 'Impossible'
      }
  }
}

function calcLengthBlocks(array = []){
  return array.reduce((prev, next) => {
    return prev + Number(next.numbers.length)
  }, 0)
}

function handlerUploadFile() {
  if (this.files.length > 1) {
    window.alert('Требуется один файл')
    return
  }
  const file = this.files[0]
  const reader = new FileReader()
  reader.readAsText(file)
  reader.addEventListener('load', () => {
    const fileResponse = reader.result
    result = formatDataInMassBlock(formatFileInArray(fileResponse))
    console.log(result)
  })
  reader.addEventListener('error', () => window.alert('Ошибка при загрузке файла'))
}

async function handlerStartBlock({ result, inputTicket, inputDate }) {
  const { description, ticket, tillDate, btnSubmit, license, select } = htmlElements
  const errors = []
  const blocks = []
  if (result.length < 1) {
    return
  }
  postMessageInTelegram([
    `\*start\* \_block\_`,
    `\`Tickets:\` ${inputTicket.value}`,
    `\`Date:\` ${inputDate.value}`,
    `\`Summary:\` ${calcLengthBlocks(result)}`
  ])
  postMessageInLogger({ status: 'start', title: calcLengthBlocks(result) })

  for (let i = 0; i < result.length; i++) {
    try {
      console.log(i)
      await CreatePromise(() => {
        select.value = 'Driver'
        select.dispatchEvent(new Event('change'))
        return true
      }, {})
      await CreatePromise(() => {
        if (getComputedStyle(license).display === 'block') {
          return true
        }
        return {
          title: 'display error',
        }
      }, {})
      await CreatePromise(() => {
        license.value = result[i].numbers.join('\n')
        return true
      }, {})
      await CreatePromise(() => {
        description.value = result[i].title
        return true
      }, {})
      await CreatePromise(() => {
        ticket.value = inputTicket.value
        return true
      }, {})
      await CreatePromise(() => {
        tillDate.value = inputDate.value
        return true
      }, {})
      await CreatePromise(() => {
        btnSubmit.click()
        return true
      }, {})
      await CreatePromise(() => {
        if (select.value === '') {
          postMessageInLogger({
            status: 'block',
            numbers: result[i].numbers,
            title: result[i].title,
          })
          console.log(`Total numbers: ${result[i].numbers.length} Template: ${result[i].title}`)
          blocks.push(result[i])
          return true
        }
        return {
          title: result[i].title,
          numbers: result[i].numbers
        }
      }, { delay: DELAY_BLOCK })
    } catch (e) {
      if (e.name === 'AbortError') {
        console.error('Abort catch')
        postMessageInLogger({ status: 'abort' })
        postMessageInTelegram([`\*abort\* \_block\_`])
        return
      }
      postMessageInLogger({ status: 'error', title: result[i].title, numbers: result[i].numbers })
      console.error(e)
      errors.push(result[i])
    }
  }
  postMessageInTelegram([
    `\*end\* \_block\_`,
    `\`Stats:\``,
    `\`- Total: ${calcLengthBlocks(result)}\``,
    `\`- Blocks: ${calcLengthBlocks(blocks)}\``,
    `\`- Errors: ${calcLengthBlocks(errors)}\``
  ])
  postMessageInLogger({ status: 'finish' })
  console.log('finish blocks')
}

function createUpload(root) {
  const spanElement = CreateElement({
    name: 'span',
    options: {
      style: 'margin: 15px 0; display: flex; align-items: center; justify-content: end;'
    }
  })
  const inputFile = CreateElement({
    name: 'input',
    options: {
      type: 'file',
      accept: '.csv',
      id: 'upload-block-file'
    },
    events: {
      change: handlerUploadFile
    }
  })
  const inputTicket = CreateElement({
    name: 'input',
    options: {
      style: 'margin: 0 15px; width: 30%;',
      placeholder: 'ticket'
    }
  })
  const inputDate = CreateElement({
    name: 'input',
    options: {
      style: 'margin: 0 15px',
      type: 'date',
    }
  })
  const buttonElementStart = CreateElement({
    name: 'button',
    contents: {
      className: 'btn btn-primary',
      textContent: 'Start'
    },
    events: {
      click: () => handlerStartBlock({ result, inputTicket, inputDate })
    }
  })
  const buttonElementAbort = CreateElement({
    name: 'button',
    options: {
      style: 'margin-left: 10px;'
    },
    contents: {
      className: 'btn btn-default',
      textContent: 'Abort'
    },
    events: {
      click: (e) => {
        e.preventDefault()
        controllerAbort.abort()
      }
    }
  })
  root.before(spanElement)
  spanElement.append(inputFile, inputTicket, inputDate, buttonElementStart, buttonElementAbort)
}

function createLogger(root) {
  const wrapper = CreateElement({
    name: 'div',
    options: {
      style: 'height: 400px; display: flex; flex-direction: column; box-shadow: black 0px 6px 12px; margin: 0; border-radius: 5px 5px 0 0; overflow-y: scroll; background-color: #fff; padding: 20px;'
    }
  })
  const logger = CreateElement({ name: 'div' })
  wrapper.append(logger)
  root.after(wrapper)

  return ({ status, title, numbers}) => {
    const { style, message } = switchMessageInLogger({ status, title, numbers, })
    const p = CreateElement({
      name: 'p',
      options: {
        style
      }
    })
    const small = CreateElement({
      name: 'small',
      contents: {
        textContent: message
      }
    })
    p.append(small)
    logger.append(p)
  }
}

const postMessageInLogger = createLogger(htmlElements.root)
createUpload(htmlElements.root)
