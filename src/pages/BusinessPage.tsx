import { Container, Typography, Paper, Box, Table, TableBody, TableCell, TableContainer, TableRow, Link } from '@mui/material';

export default function BusinessPage() {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                特定商取引法に基づく表記
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    プラットフォーム運営者情報
                </Typography>
                <TableContainer>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>
                                    サービス名
                                </TableCell>
                                <TableCell>
                                    マルシェオーダー (Marche Order)
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    運営者
                                </TableCell>
                                <TableCell>
                                    廣岡 勇太
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    運営統括責任者
                                </TableCell>
                                <TableCell>
                                    廣岡 勇太
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    所在地
                                </TableCell>
                                <TableCell>
                                    請求があったら遅滞なく開示します
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    電話番号
                                </TableCell>
                                <TableCell>
                                    請求があったら遅滞なく開示します
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    お問い合わせ先
                                </TableCell>
                                <TableCell>
                                    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSdnG4UzAHJamOHofSIvkcd7nmOJAHadO2aEupUOiDW6YwdELQ/viewform" target="_blank" rel="noopener noreferrer">
                                        お問い合わせフォーム
                                    </Link>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    サービス内容
                                </TableCell>
                                <TableCell>
                                    モバイルオーダープラットフォーム「マルシェオーダー」の運営・提供。<br />
                                    本サービスを通じて、出店者は商品の販売を行い、利用者は商品の注文・決済を行います。
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 1, borderBottom: 1, borderColor: 'divider' }}>
                    商品の販売条件（出店者との取引）
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    以下は、本プラットフォームを利用して行われる、出店者と利用者との間の売買取引に関する共通条件です。
                </Typography>
                <TableContainer>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>
                                    販売価格
                                </TableCell>
                                <TableCell>
                                    各出店者が設定し、メニューページに表示された価格に基づきます（消費税は内税または外税として表示）。
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    商品代金以外の必要料金
                                </TableCell>
                                <TableCell>
                                    インターネット接続料金、通信料金はお客様の負担となります。
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    お支払い方法
                                </TableCell>
                                <TableCell>
                                    クレジットカード決済 (Stripe)<br />
                                    ※その他、各出店者が定める決済方法（現金、PayPay等）がある場合は、店舗での精算となります。
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    お支払い時期
                                </TableCell>
                                <TableCell>
                                    クレジットカード決済の場合は、注文確定時に決済が完了します。<br />
                                    その他（現金等）の場合は、店舗での商品受け渡し時にお支払いください。
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    商品の引渡時期
                                </TableCell>
                                <TableCell>
                                    注文完了後、各出店者の店舗にて即時または指定の時間に商品をお渡しします。
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    返品・キャンセルについて
                                </TableCell>
                                <TableCell>
                                    各出店者が定めるキャンセルポリシーに基づきます。<br />
                                    原則としてお客様都合による返品・キャンセルはお受けできません。<br />
                                    商品に不備があった場合は、各出店者へ直接お申し出ください。
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    <Link href="/" color="inherit">
                        トップページへ戻る
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}
