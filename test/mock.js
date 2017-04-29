var sinon = require('sinon');
/*
 * Provide mock data for use in tests
 */

var PropertiesService = {
  getUserProperties: function() {
    var _value = {};
    return {
      setProperty: function(key, value) {
        _value[key] = value;
      },
      getProperty: function(key) {
        return _value[key];
      }
    };
  }
};

var Drive = {
  Files: {
    insert: sinon.stub(),
    copy: sinon.stub(),
    list: sinon.stub()
  }
};

// https://developers.google.com/drive/v2/reference/files/get
var item = {
  kind: 'drive#file',
  id: '1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw',
  etag: '"H5Hv_ZhVlK228vwAeoDGtniOiaU/MTQ2OTgzMjA4NTI5NQ"',
  selfLink: 'https://www.googleapis.com/drive/v2/files/1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw',
  alternateLink: 'https://docs.google.com/document/d/1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw/edit?usp=drivesdk',
  embedLink: 'https://docs.google.com/document/d/1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw/preview',
  iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.document',
  thumbnailLink: 'https://docs.google.com/feeds/vt?gd=true&id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&v=2&s=AMedNnoAAAAAWOAZ8P_LQcv0bjk6B3l7EVaSUjI8ko3s&sz=s220',
  title: 'Geology Trivia',
  mimeType: 'application/vnd.google-apps.document',
  labels: {
    starred: false,
    hidden: false,
    trashed: false,
    restricted: false,
    viewed: true
  },
  createdDate: '2016-07-29T22:41:11.831Z',
  modifiedDate: '2016-07-29T22:41:25.295Z',
  modifiedByMeDate: '2016-07-29T22:41:25.295Z',
  lastViewedByMeDate: '2017-04-01T19:21:18.334Z',
  markedViewedByMeDate: '1970-01-01T00:00:00.000Z',
  version: '1188595',
  parents: [
    {
      kind: 'drive#parentReference',
      id: '0AClyXjPTESTPARENTID9PVA',
      selfLink: 'https://www.googleapis.com/drive/v2/files/1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw/parents/0AClyXjPTESTPARENTID9PVA',
      parentLink: 'https://www.googleapis.com/drive/v2/files/0AClyXjPTESTPARENTID9PVA',
      isRoot: true
    }
  ],
  exportLinks: {
    'application/rtf': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=rtf',
    'application/vnd.oasis.opendocument.text': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=odt',
    'text/html': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=html',
    'application/pdf': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=pdf',
    'application/epub+zip': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=epub',
    'application/zip': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=docx',
    'text/plain': 'https://docs.google.com/feeds/download/documents/export/Export?id=1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw&exportFormat=txt'
  },
  userPermission: {
    kind: 'drive#permission',
    etag: '"H5Hv_ZhVlK228vwAeoDGtniOiaU/rsqH_mtEIhPHQDl_yZ4zaa1S-zc"',
    id: 'me',
    selfLink: 'https://www.googleapis.com/drive/v2/files/1K0aLuzyWvYt1SxYpTHISISATESTV9Y4fBYw/permissions/me',
    role: 'owner',
    type: 'user'
  },
  quotaBytesUsed: '0',
  ownerNames: ['Eric Dauenhauer'],
  owners: [
    {
      kind: 'drive#user',
      displayName: 'Eric Dauenhauer',
      picture: {
        url: 'https://lh6.googleusercontent.com/-t2CzMrU_66E/AAAAAAAAAAI/AAAAAAAAADg/nbum6einNP8/s64/photo.jpg'
      },
      isAuthenticatedUser: true,
      permissionId: '09563987345987156811',
      emailAddress: 'eric@ericyd.com'
    }
  ],
  lastModifyingUserName: 'Eric Dauenhauer',
  lastModifyingUser: {
    kind: 'drive#user',
    displayName: 'Eric Dauenhauer',
    picture: {
      url: 'https://lh6.googleusercontent.com/-t2CzMrU_66E/AAAAAAAAAAI/AAAAAAAAADg/nbum6einNP8/s64/photo.jpg'
    },
    isAuthenticatedUser: true,
    permissionId: '09563987345987156811',
    emailAddress: 'eric@ericyd.com'
  },
  capabilities: {
    canCopy: true,
    canEdit: true
  },
  editable: true,
  copyable: true,
  writersCanShare: true,
  shared: false,
  explicitlyTrashed: false,
  appDataContents: false,
  spaces: ['drive']
};

module.exports.PropertiesService = PropertiesService;
module.exports.Drive = Drive;
module.exports.item = item;
module.exports.file = item; // convenience export
