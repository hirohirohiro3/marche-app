import { Box, Container, Typography, List, ListItem, ListItemText } from '@mui/material';

const sections = [
  {
    title: 'はじめに',
    content: [
      'マルシェオーダー（以下「当方」といいます）は、当方が提供するマルシェ用注文ウェブアプリケーション（以下「本サービス」といいます）における、利用者に関する情報（以下「利用者情報」といいます）の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。利用者は、本サービスを利用する前に本ポリシーをよくお読みいただき、内容に同意の上、本サービスをご利用ください。',
    ],
  },
  {
    title: '収集する利用者情報及び収集方法',
    description: '本サービスにおいて当方が収集する利用者情報は、以下のとおりです。',
    points: [
      {
        primary: '端末情報及びアクセスログ情報',
        secondary: '利用者が本サービスを利用する際、使用している端末固有の情報（例：ユーザーエージェント、IPアドレス）やアクセスログ（アクセス日時、利用機能等）を自動的に取得する場合があります。',
      },
      {
        primary: '顧客識別ID (uid)',
        secondary: '利用者が本サービスを通じて注文を行った場合、注文状況を追跡・表示するために、利用者のブラウザのLocalStorageに顧客識別ID (uid) を保存します。このIDは個人を直接特定するものではありませんが、利用者のデバイスに紐づく情報となります。',
      },
      {
        primary: 'お問い合わせフォームを通じて提供される情報',
        secondary: '利用者が本サービス内のお問い合わせフォームを通じて連絡を行う場合、任意で提供される氏名、返信用メールアドレス、お問い合わせ内容に含まれる情報等を収集します。',
      },
    ],
  },
  {
    title: '利用目的',
    description: '当方は、収集した利用者情報を以下の目的で利用します。',
    points: [
      { primary: '本サービスの提供、維持、改善のため（例：注文処理、注文状況の表示）' },
      { primary: '本サービスの利用状況の分析のため' },
      { primary: '本サービスに関するお問い合わせ等への対応のため（お問い合わせフォームからの連絡への返信を含みます）' },
      { primary: '本規約等に違反する行為に対する対応のため' },
    ],
  },
  {
    title: '個人情報の第三者提供',
    description: '当方は、利用者情報のうち、個人情報保護法上の「個人情報」に該当するものについて、あらかじめ利用者の同意を得ることなく、第三者に提供しません。ただし、次に掲げる場合はこの限りではありません。',
    points: [
      { primary: '法令に基づく場合' },
      { primary: '人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき' },
      { primary: '公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき' },
      { primary: '国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき' },
    ],
  },
  {
    title: '個人情報の管理',
    content: [
      '当方は、利用者情報の漏洩、滅失または毀損の防止その他の利用者情報の安全管理のために必要かつ適切な措置を講じます。本サービスにおける利用者情報の管理には、Firebaseの提供するセキュリティ機能を利用しています。お問い合わせフォームを通じて取得した情報は、当方にて適切に管理します。',
    ],
  },
  {
    title: 'Cookie、LocalStorage等の技術の利用',
    content: [
      '本サービスは、利用者の利便性の向上や注文状況の追跡のため、CookieやLocalStorage等の技術を利用することがあります。顧客識別ID (uid) は、利用者のブラウザのLocalStorageに保存されます。利用者は、ブラウザの設定を変更することにより、これらの技術の利用を無効化することができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。',
    ],
  },
  {
    title: '利用者の権利',
    content: [
      '本サービスでは、お問い合わせフォームを除き、氏名やメールアドレス等、利用者が直接当方に提供する個人情報は収集しておりません。LocalStorageに保存される顧客識別ID (uid) の削除については、利用者が自身のブラウザ設定から行うことができます。お問い合わせフォームを通じて提供された個人情報の開示、訂正、削除等を希望される場合は、第9条のお問い合わせ窓口までご連絡ください。',
    ],
  },
  {
    title: 'プライバシーポリシーの変更',
    content: [
      '当方は、法令の変更やサービスの改善に伴い、本ポリシーを改定することがあります。重要な変更を行う場合には、本サービス上での告知など、適切な方法により利用者に通知します。変更後のプライバシーポリシーは、本サービス上に掲載したときから効力を生じるものとします。',
    ],
  },
  {
    title: 'お問い合わせ先',
    content: [
      '利用者情報の取扱いに関するご意見、ご質問、苦情のお申し出その他利用者情報の取扱いに関するお問い合わせは、本サービス内に設置されたお問い合わせフォームよりご連絡ください。',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <Container sx={{ py: 4, color: 'text.primary' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        マルシェオーダー プライバシーポリシー
      </Typography>

      {sections.map((section, index) => (
        <Box key={index} sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            {section.title}
          </Typography>

          {section.description && <Typography sx={{ mt: 2 }}>{section.description}</Typography>}

          {section.content && section.content.map((item, cIndex) => (
            <Typography key={cIndex} sx={{ mt: 2 }}>{item}</Typography>
          ))}

          {section.points && (
            <List sx={{ listStyleType: 'decimal', pl: 4, pt: 1 }}>
              {section.points.map((point, pIndex) => (
                <ListItem key={pIndex} sx={{ display: 'list-item', p: 0, pt: 0.5 }}>
                  <ListItemText primary={point.primary} secondary={point.secondary || undefined} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      ))}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" component="h3">
          附則
        </Typography>
        <Typography sx={{ mt: 2 }}>
          本ポリシーは、2025年10月26日から施行します。
        </Typography>
      </Box>
    </Container>
  );
}
