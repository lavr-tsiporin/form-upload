const DELAY_BLOCK = 5 //s
let result = []

const controllerAbort = new AbortController()

const htmlElements = {
  user: document.querySelector('img.avatar'),
  root: document.querySelector('#addBlocking'),
  license: document.querySelector('input[name="key"]'),
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
    result = formatFileInArray(fileResponse)
    console.log(result)
  })
  reader.addEventListener('error', () => window.alert('Ошибка при загрузке файла'))
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

function postMessageInTelegram(message) {
  const user = htmlElements.user.getAttribute('src').match(/.+\/user\/(.+)\/avatar/)[1]
  window.open(`https://api.telegram.org/bot${API_KEY}/sendMessage?chat_id=${CHAT_ID}&text=\`WEB\` \*${user}\* ${message}&parse_mode=Markdown`,
    "_blank", "resizable=no,top=10,left=300,width=100,height=100")
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

async function handlerStartBlock({ result, inputTicket, inputDate }) {
  const { description, ticket, tillDate, btnSubmit, license } = htmlElements
  let errors = 0
  if (result.length < 1) {
    return
  }
  postMessageInTelegram(`\*start\* \_block\_, with ticket \`${inputTicket.value}\` with date \`${inputDate.value}\` in summary ${result.length}`)

  for (let i = 0; i < result.length; i++) {
    try {
      await CreatePromise(() => {
        document.querySelector('select.form-control').value = '2'
        return true
      }, {})
      await CreatePromise(() => {
        license.value = result[i].license
        return true
      }, {})
      await CreatePromise(() => {
        description.value = result[i].resolution
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
        const select = document.querySelector('select.form-control')
        if (select.value === '') {
          postMessageInLogger({ status: 'ok', number: result[i].license, resolution: result[i].resolution })
          console.log(`${result[i].license} blocks with ${result[i].resolution}`)
          return true
        }
        return result[i].license
      }, { delay: DELAY_BLOCK })
    } catch (e) {
      if (e.name === 'AbortError') {
        postMessageInLogger({ status: 'error', number: result[i].license, resolution: 'abort' })
        console.error('Abort catch')
        postMessageInTelegram(`\*abort\* \_block\_`)
        return
      }
      postMessageInLogger({ status: 'error', number: result[i].license, resolution: 'not block' })
      console.error(e)
      errors += 1
    }
  }
  postMessageInTelegram(`\*end\* \_block\_ ${"%0A"}\`Stats:\`${"%0A"}\`- Total: ${result.length}\`${"%0A"}\`- Errors: ${errors}\``)
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

  return ({ status, number, resolution }) => {
    const p = CreateElement({
      name: 'p',
      options: {
        style: `color: ${status !== 'error' ? '#000' : 'red'}`
      }
    })
    const small = CreateElement({
      name: 'small',
      contents: {
        textContent: status !== 'error'
          ? `[${new Date(Date.now()).toISOString()}] ${number} blocks with ${resolution}`
          : `[${new Date(Date.now()).toISOString()}] ${number} error ${resolution}`
      }
    })
    p.append(small)
    logger.append(p)
  }
}

const postMessageInLogger = createLogger(htmlElements.root)
createUpload(htmlElements.root)
