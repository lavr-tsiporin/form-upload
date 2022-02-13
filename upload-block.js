const DELAY_BLOCK = 10 //s
let result = []

const htmlElements = {
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
      style: 'margin: 0 15px;',
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
  const buttonElement = CreateElement({
    name: 'button',
    contents: {
      className: 'btn btn-primary',
      textContent: 'Start'
    },
    events: {
      click: () => handlerStartBlock({ result, inputTicket, inputDate })
    }
  })
  root.before(spanElement)
  spanElement.append(inputFile, inputTicket, inputDate, buttonElement)
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

async function handlerStartBlock({ result, inputTicket, inputDate }) {
  const { description, ticket, tillDate, btnSubmit, license } = htmlElements
  if (result.length < 1) {
    return
  }

  for (let i = 0; i < result.length; i++) {
    try {
      await new Promise((resolve) => {
        setTimeout(() => {
          document.querySelector('select.form-control').value = '2'
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          license.value = result[i].license
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          description.value = result[i].resolution
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          ticket.value = inputTicket.value
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          tillDate.value = inputDate.value
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          btnSubmit.click()
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const select = document.querySelector('select.form-control')
          if (select.value !== '') {
            reject(result[i].license)
          }
          console.log(`${result[i].license} blocks with ${result[i].resolution}`)
          resolve(true)
        }, DELAY_BLOCK * 1000)
      })
    } catch (e) {
      console.error(e)
    }
  }
}

createUpload(htmlElements.root)