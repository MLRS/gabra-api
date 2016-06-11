// server-specific settings
module.exports = {
  baseURL: '',
  fullBaseURL: 'http://localhost:3000',
  useCDN: false,
  developmentMode: true, // turns off analytics etc
  maintenanceMode: false, // put entire site down
  gabraURL: 'http://mlrs.research.um.edu.mt/resources/gabra',
  salt: '',
  dbUrl: 'localhost:27017/gabra',
  dbOptions: {
    username: '',
    password: ''
  },
  analyticsCode: null
}
