const functions = require('firebase-functions');
const app = require('actions-on-google').actionssdk();

const mainIntent = conv => {
  if (conv.user.last && conv.user.last.seen) {
    const list = conv.user.storage.list || [];
    const keepingMessage = (list.length > 1 && `${list.length}個のメモを覚えてますよ。`)
      || (list.length === 1 && `1個メモを記録しています。`)
      '';
    conv.ask(`おかえりなさい！${keepingMessage || ''}どうしましょう？メモを聞く場合は、メモ参照、メモする場合は、メモして、と言ってください。`);
  } else {
    conv.ask(`はじめまして！メモアプリへようこそ！どうしましょう？`);
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
      return { intent: 'FINISH', output: `${inputText}、ですね。覚えておきます。` };
    } else if (intent === 'PLAY') {
      if (/もう一度|繰り返して/.test(inputText)) {
        return { intent: 'PLAY', output: `${list[0]}、と覚えていました。このメモを消してもいいですか？` };
      } else if (/はい/.test(inputText)) {
        conv.user.storage.list = list.slice(1);
        return { intent: 'FINISH', output: `メモを消去します！ではまた。` };
      } else if (/いいえ/.test(inputText)) {
        return { intent: 'FINISH', output: `まだ覚えておきますね。ではまた。` };
      }
      return {
        intent: 'PLAY',
        output:
          'ごめんなさいわからなかったです、このメモを消しますか？はい、か、いいえ、でこたえてください。',
      };
    }
  }
  if (/ばいばい|バイバイ/.test(inputText)) {
    return { intent: 'FINISH', output: 'Goodbye!' };
  } else if (/メモ参照|メモ聞く/.test(inputText)) {
    const list = conv.user.storage.list;
    if (list && list.length > 0) {
      conv.data.intent = 'PLAY';
      return { intent: 'PLAY', output: `${list[0]}、とのことです。消しますか？` };
    }
    return { intent: 'FINISH', output: 'すいません、何もメモはないようです。' };
  } else if (/メモして|メモする/.test(inputText)) {
    conv.data.intent = 'NEED_TO_RECORD';
    return { intent: 'NEED_TO_RECORD', output: '了解です、何をメモしましょう？' };
  }
  return { intent: 'UNKNOWN' };
};

const subIntent = (conv, inputText) => {
  const result = analyzeConversation(conv, inputText);
  if (result.intent === 'FINISH') {
    conv.close(result.output);
  } else if (result.intent === 'UNKNOWN') {
    conv.ask('よくわからんです、どうしましょう？メモ参照、メモして、などとお願いします。');
  } else {
    conv.ask(result.output);
  }
};

app.intent('actions.intent.MAIN', mainIntent);
app.intent('actions.intent.TEXT', subIntent);

exports.memo = functions.https.onRequest(app);
