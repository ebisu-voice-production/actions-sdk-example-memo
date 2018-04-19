const functions = require('firebase-functions');
const app = require('actions-on-google').actionssdk();

const mainIntent = conv => {
  if (conv.user.last && conv.user.last.seen) {
    const list = conv.user.storage.list || [];
    const keepingMessage = (list.length > 1 && `I remember ${list.length} things.`)
      || (list.length === 1 && `I remember one thing.`)
      '';
    conv.ask(`Hey you're back! ${keepingMessage} What's up?`);
  } else {
    conv.ask(`Welcome to memo application! What's up?`);
  }
};

const analyzeConversation = (conv, inputText) => {
  const lastConversation = conv.data;
  const storage = conv.user.storage;
  if (lastConversation) {
    const intent = lastConversation.intent;
    const list = storage.list || [];
    if (intent === 'NEED_TO_RECORD') {
      conv.user.storage.list = [...list, inputText];
      return { intent: 'FINISH', output: `You said, ${inputText}. I will keep it in mind.` };
    } else if (intent === 'PLAY') {
      if (/repeat/.test(inputText)) {
        return { intent: 'PLAY', output: `I said, ${list[0]}. Would you like to delete this?` };
      } else if (/yes/.test(inputText)) {
        conv.user.storage.list = list.slice(1);
        return { intent: 'FINISH', output: `Ok, I deleted the memo. Goodbye!` };
      } else if (/no/.test(inputText)) {
        return { intent: 'FINISH', output: `Ok, I continue to keep it in mind. Goodbye!` };
      }
      return {
        intent: 'PLAY',
        output:
          'Sorry, I can not understand. Would you like to delete the memo? Please answer yes, no, or repeat.',
      };
    }
  }
  if (/bye/.test(inputText)) {
    return { intent: 'FINISH', output: 'Goodbye!' };
  } else if (/remind me/.test(inputText)) {
    const list = conv.user.storage.list;
    if (list && list.length > 0) {
      conv.data.intent = 'PLAY';
      return { intent: 'PLAY', output: `You said, ${list[0]}. Would you like to delete this?` };
    }
    return { intent: 'FINISH', output: 'Sorry, I have not remind anything.' };
  } else if (/keep in mind/.test(inputText)) {
    conv.data.intent = 'NEED_TO_RECORD';
    return { intent: 'NEED_TO_RECORD', output: 'Ok, What do you let me remember?' };
  }
  return { intent: 'UNKNOWN' };
};

const subIntent = (conv, inputText) => {
  const result = analyzeConversation(conv, inputText);
  if (result.intent === 'FINISH') {
    conv.close(result.output);
  } else if (result.intent === 'UNKNOWN') {
    conv.ask('Sorry, What do you want to do?');
  } else {
    conv.ask(result.output);
  }
};

app.intent('actions.intent.MAIN', mainIntent);
app.intent('actions.intent.TEXT', subIntent);

exports.memo = functions.https.onRequest(app);
