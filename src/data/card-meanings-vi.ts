/**
 * Vietnamese card meanings, translated from "tarot meaning/tarot_card_meanings.csv"
 * (same numbering 0–77). Short keyword phrases on purpose: they are fed to the
 * model (few tokens, no English leaking into Vietnamese readings) and shown under
 * the card in the UI.
 * Tuple order: [upright, reversed, love, career].
 */
export type MeaningTuple = readonly [upright: string, reversed: string, love: string, career: string];

export const CARD_MEANINGS_VI: readonly MeaningTuple[] = [
  // Major Arcana
  ['Khởi đầu mới, hồn nhiên, phiêu lưu, tinh thần tự do', 'Liều lĩnh, sợ thay đổi, chần chừ', 'Mối tình mới đầy hứng khởi, yêu tự nhiên', 'Hướng đi mới, dám bước một bước liều'],
  ['Hiện thực hoá, ý chí, biết tận dụng nguồn lực', 'Thao túng, kế hoạch kém, tài năng chưa dùng tới', 'Sức hút mạnh, chủ động theo đuổi', 'Làm chủ kỹ năng, cơ hội mới'],
  ['Trực giác, bí ẩn, trí tuệ nội tâm, tiềm thức', 'Bí mật, mất kết nối với trực giác', 'Cảm xúc thầm kín, hãy tin cảm nhận của mình', 'Nghe theo linh cảm, thông tin ẩn'],
  ['Sung túc, nuôi dưỡng, sinh sôi, vẻ đẹp', 'Bất an, bỏ bê bản thân, bế tắc sáng tạo', 'Tình yêu sâu đậm, gắn kết ấm áp', 'Phát triển, thịnh vượng, thành công sáng tạo'],
  ['Quyền lực, cấu trúc, lãnh đạo, ổn định', 'Áp đặt, cứng nhắc, thiếu kỷ luật', 'Người yêu cam kết, che chở', 'Vai trò lãnh đạo, thăng tiến'],
  ['Truyền thống, chỉ dẫn tinh thần, theo khuôn khổ', 'Nổi loạn, phá khuôn, cách làm mới', 'Mối quan hệ truyền thống, cam kết', 'Có người dẫn dắt, con đường quen thuộc'],
  ['Tình yêu, lựa chọn, đồng hành, hài hoà', 'Bất hoà, mất cân bằng, lệch giá trị', 'Kết nối tri kỷ, gắn bó sâu sắc', 'Mối hợp tác quan trọng, lựa chọn nghề nghiệp'],
  ['Quyết tâm, ý chí, chiến thắng, làm chủ', 'Mất phương hướng, nóng nảy', 'Tự tin theo đuổi tình yêu', 'Tham vọng, thắng lợi trong công việc'],
  ['Can đảm, kiên nhẫn, sức mạnh nội tâm, bao dung', 'Nghi ngờ bản thân, yếu lòng, bất an', 'Tình yêu kiên nhẫn, dịu dàng mà vững vàng', 'Bền bỉ, vượt qua thử thách'],
  ['Tự soi chiếu, tĩnh lặng một mình, dẫn lối từ bên trong', 'Cô lập, cô đơn, thu mình', 'Hiểu mình trước khi yêu', 'Suy ngẫm về sự nghiệp, tìm mục đích'],
  ['Chu kỳ, vận mệnh, bước ngoặt, may mắn', 'Kém may, cưỡng lại thay đổi', 'Duyên số, mối quan hệ chuyển hướng', 'Đổi việc, cơ hội bất ngờ'],
  ['Công bằng, sự thật, trách nhiệm, luật lệ', 'Bất công, thiếu trung thực, né trách nhiệm', 'Quan hệ sòng phẳng, nhân quả', 'Việc pháp lý, quyết định có đạo đức'],
  ['Buông bỏ, góc nhìn mới, tạm dừng', 'Trì hoãn, kháng cự, do dự', 'Mối quan hệ tạm lắng, nhìn lại từ góc khác', 'Tạm dừng sự nghiệp, nhìn vấn đề khác đi'],
  ['Chuyển hoá, kết thúc, khởi đầu mới, thay đổi', 'Sợ thay đổi, trì trệ', 'Mối quan hệ chuyển hoá, học cách buông', 'Kết thúc một việc để bắt đầu lại'],
  ['Cân bằng, kiên nhẫn, điều độ, mục đích', 'Mất cân bằng, thái quá, thiếu kiên nhẫn', 'Quan hệ cân bằng, hài hoà', 'Cân bằng công việc – cuộc sống, kiên nhẫn sẽ được đền đáp'],
  ['Lệ thuộc, vật chất, mặt tối, ràng buộc', 'Thoát ra, gỡ bỏ niềm tin giới hạn', 'Gắn bó độc hại, đam mê thiếu chiều sâu', 'Thấy bị mắc kẹt trong công việc, chạy theo vật chất'],
  ['Biến động đột ngột, đổ vỡ, sự thật lộ ra', 'Tránh được tai hoạ, sợ thay đổi', 'Mối quan hệ chao đảo, sự thật phơi bày', 'Mất việc bất ngờ, xáo trộn lớn'],
  ['Hy vọng, hồi phục, tâm linh, cảm hứng', 'Tuyệt vọng, mất niềm tin, mất kết nối', 'Tình yêu chữa lành, hy vọng trở lại', 'Cảm hứng sáng tạo, công việc mơ ước'],
  ['Ảo ảnh, nỗi sợ, tiềm thức, lo âu', 'Nỗi sợ tan dần, mọi thứ rõ ra', 'Rối bời trong tình cảm, cảm xúc giấu kín', 'Chưa chắc chắn, hãy tin trực giác'],
  ['Niềm vui, thành công, sức sống, tích cực', 'Buồn thoáng qua, chưa thấy rõ', 'Hạnh phúc lứa đôi, niềm vui trong tình yêu', 'Thành công, được ghi nhận'],
  ['Tái sinh, nhìn lại, thức tỉnh, tha thứ', 'Nghi ngờ bản thân, không chịu rút kinh nghiệm', 'Đánh giá lại mối quan hệ, cơ hội thứ hai', 'Tiếng gọi nghề nghiệp, quyết định quan trọng'],
  ['Hoàn thành, thành tựu, du hành, trọn vẹn', 'Dang dở, đi tắt, chậm trễ', 'Tình yêu viên mãn, tìm được tri kỷ', 'Đạt mục tiêu, cột mốc sự nghiệp'],
  // Wands (Gậy)
  ['Cảm hứng, dự định mới, tiềm năng, sáng tạo', 'Chậm trễ, thiếu động lực, do dự', 'Sức hút mới, đam mê', 'Ý tưởng kinh doanh mới, tia lửa sáng tạo'],
  ['Lập kế hoạch, tầm nhìn, quyết định, khám phá', 'Sợ điều chưa biết, thiếu kế hoạch', 'Cân nhắc giữa các lựa chọn, lên kế hoạch tương lai', 'Kế hoạch kinh doanh, mở rộng tầm nhìn'],
  ['Mở rộng, nhìn xa, cơ hội ở xa', 'Chậm trễ, trở ngại, bực bội', 'Yêu xa, cùng nhau trưởng thành', 'Mở rộng kinh doanh, làm việc với nước ngoài'],
  ['Ăn mừng, trở về nhà, hài hoà, cộng đồng', 'Thiếu hài hoà, chuyển tiếp, bất ổn', 'Đính hôn, đám cưới, mái ấm vui vẻ', 'Thành công của cả nhóm, ăn mừng'],
  ['Xung đột, cạnh tranh, căng thẳng, bất đồng', 'Né tránh xung đột, mâu thuẫn nội tâm', 'Cãi vã, tranh giành sự chú ý', 'Cạnh tranh nơi làm việc, khác biệt ý tưởng'],
  ['Chiến thắng, được công nhận, thành công', 'Sa sút, cái tôi, không được ghi nhận', 'Công khai mối quan hệ, được ngưỡng mộ', 'Thăng chức, được công nhận'],
  ['Phòng thủ, kiên trì, giữ vững lập trường', 'Bỏ cuộc, quá tải, kiệt sức', 'Bảo vệ mối quan hệ, giữ ranh giới', 'Giữ vị trí, đối mặt cạnh tranh'],
  ['Tốc độ, chuyển động, tiến triển nhanh, di chuyển', 'Chậm trễ, sốt ruột, chờ đợi', 'Tình cảm tiến nhanh, tin vui', 'Sự nghiệp tiến nhanh, đi công tác'],
  ['Kiên cường, can đảm, bền bỉ, trận cuối', 'Kiệt sức, buông xuôi, quá tải', 'Trái tim phòng bị, cố gắng qua giai đoạn khó', 'Sắp tới đích, đừng bỏ cuộc'],
  ['Gánh nặng, trách nhiệm, làm việc vất vả, căng thẳng', 'San sẻ việc, buông bớt, gục ngã', 'Một mình gánh mối quan hệ', 'Quá tải, cần giao bớt việc'],
  ['Nhiệt huyết, khám phá, tinh thần tự do', 'Thiếu định hướng, vấp váp, trì hoãn', 'Cảm nắng mới, năng lượng tán tỉnh', 'Dự án sáng tạo mới, cơ hội học hỏi'],
  ['Năng lượng, đam mê, phiêu lưu, bốc đồng', 'Vội vàng, năng lượng phân tán, chậm trễ', 'Tình yêu nồng nhiệt nhưng chóng qua', 'Hành động nhanh, đi xa vì công việc'],
  ['Tự tin, quyết tâm, vui tươi, rực rỡ', 'Ích kỷ, ghen tuông, đòi hỏi', 'Người yêu cuốn hút, tình yêu ấm áp', 'Lãnh đạo, người phụ nữ kinh doanh tự tin'],
  ['Lãnh đạo, tầm nhìn, tinh thần khởi nghiệp, danh dự', 'Bốc đồng, độc đoán, gay gắt', 'Cử chỉ lãng mạn táo bạo, người yêu nồng nhiệt', 'Người dẫn dắt kinh doanh, quyết định táo bạo'],
  // Cups (Cốc)
  ['Tình yêu mới, khởi đầu cảm xúc, lòng trắc ẩn', 'Mất mát cảm xúc, cảm xúc bị chặn, trống rỗng', 'Mối quan hệ mới, kết nối cảm xúc sâu', 'Thoả mãn sáng tạo, hài lòng về cảm xúc'],
  ['Đồng hành, hấp dẫn lẫn nhau, gắn kết', 'Chia tay, mất cân bằng, bất hoà', 'Tình yêu hai chiều, quan hệ bình đẳng', 'Hợp tác kinh doanh, cộng tác'],
  ['Ăn mừng, tình bạn, niềm vui, cộng đồng', 'Ham vui quá đà, thị phi, cô lập', 'Tình yêu từ các mối quan hệ xã hội, bạn thành người yêu', 'Ăn mừng cùng nhóm, mở rộng quan hệ'],
  ['Thờ ơ, trầm ngâm, bỏ lỡ cơ hội', 'Nhận ra, chấp nhận, động lực trở lại', 'Coi tình yêu là hiển nhiên, nhàm chán', 'Mất hứng thú, bỏ qua cơ hội'],
  ['Mất mát, đau buồn, hối tiếc, thất vọng', 'Chấp nhận, bước tiếp, tìm lại bình yên', 'Tan vỡ, tiếc nuối mối tình cũ', 'Thất vọng trong công việc, chỉ nhìn vào điều đã mất'],
  ['Hoài niệm, tuổi thơ, hồn nhiên, đoàn tụ', 'Bước tiếp, rời bỏ quá khứ', 'Nối lại với người cũ, mối tình thuở nhỏ', 'Công việc cũ quay lại, hoài niệm'],
  ['Mộng tưởng, ảo ảnh, nhiều lựa chọn, mơ mộng', 'Sáng tỏ, tập trung, đưa ra quyết định', 'Kỳ vọng thiếu thực tế trong tình yêu', 'Quá nhiều lựa chọn, cần tập trung'],
  ['Rời đi, tìm ý nghĩa, rút lui', 'Sợ thay đổi, trì trệ, níu kéo', 'Rời khỏi mối quan hệ không trọn vẹn', 'Nghỉ việc để tìm mục đích'],
  ['Ước nguyện thành hiện thực, mãn nguyện, hài lòng', 'Không thoả mãn, tham lam, hụt hẫng', 'Mong ước trong tình yêu thành sự thật', 'Hài lòng với công việc, đạt mục tiêu'],
  ['Hạnh phúc, hài hoà, gia đình, viên mãn cảm xúc', 'Gia đình rạn nứt, bất hoà, lệch nhịp', 'Hôn nhân hạnh phúc, gia đình êm ấm', 'Công việc mơ ước, cân bằng cuộc sống'],
  ['Thông điệp sáng tạo, trực giác, đứa trẻ bên trong', 'Non nớt cảm xúc, bế tắc sáng tạo', 'Cử chỉ ngọt ngào, lời nhắn tình yêu mới', 'Cơ hội sáng tạo, theo đuổi nghệ thuật'],
  ['Lãng mạn, quyến rũ, giàu tưởng tượng, vẻ đẹp', 'Thất thường, viển vông, ghen tuông', 'Lời tỏ tình lãng mạn, người yêu quyến rũ', 'Theo đuổi đam mê sáng tạo, nghề nghệ thuật'],
  ['Trắc ẩn, điềm tĩnh, trực giác, chăm sóc', 'Bất an, phụ thuộc cảm xúc, thao túng cảm xúc', 'Người yêu chu đáo, thấu cảm', 'Nghề tư vấn, trí tuệ cảm xúc'],
  ['Cân bằng cảm xúc, khéo léo, uy quyền điềm tĩnh', 'Thao túng cảm xúc, thất thường', 'Người yêu từng trải, trưởng thành về cảm xúc', 'Lãnh đạo bằng sự thấu cảm, ngoại giao'],
  // Swords (Kiếm)
  ['Sáng tỏ, đột phá, sự thật, ý tưởng mới', 'Rối trí, hỗn loạn, thiếu rõ ràng', 'Giao tiếp rõ ràng trong tình yêu', 'Ý tưởng đột phá, đầu óc minh mẫn'],
  ['Do dự, bế tắc, cảm xúc bị khoá', 'Quá tải thông tin, ngợp, sắp sáng tỏ', 'Mối quan hệ ở ngã rẽ, né tránh sự thật', 'Tê liệt khi phải quyết định'],
  ['Đau lòng, buồn bã, mất mát, sự thật đau đớn', 'Hồi phục, chữa lành, tha thứ', 'Chia tay, phản bội, tổn thương', 'Mất việc, sự thật khó nghe trong công việc'],
  ['Nghỉ ngơi, hồi phục, chiêm nghiệm, phục hồi', 'Bồn chồn, kiệt sức, thiếu nghỉ ngơi', 'Mối quan hệ tạm lắng, thời gian suy ngẫm', 'Cần nghỉ phép, hồi phục sau căng thẳng'],
  ['Xung đột, thất bại, thắng bằng mọi giá, phản bội', 'Hoà giải, tha thứ, bước tiếp', 'Cãi vã, tranh giành quyền kiểm soát', 'Chính trị văn phòng, cạnh tranh không lành mạnh'],
  ['Chuyển tiếp, rời đi, hồi phục, di chuyển', 'Trì trệ, kháng cự, việc còn dang dở', 'Bước qua nỗi đau tình cảm', 'Chuyển đổi công việc, chuyển nơi ở'],
  ['Lừa dối, mưu lược, lén lút, khôn lỏi', 'Thú nhận, nói thật, lương tâm', 'Thiếu trung thực, bí mật trong mối quan hệ', 'Chiêu trò nơi làm việc, cần cẩn trọng'],
  ['Bị giới hạn, mắc kẹt, niềm tin tự trói buộc', 'Tự do, giải thoát, góc nhìn mới', 'Thấy bị mắc kẹt trong mối quan hệ', 'Bế tắc sự nghiệp, tự đặt giới hạn'],
  ['Lo âu, trăn trở, ác mộng, sợ hãi', 'Hy vọng, hồi phục, tìm người giúp đỡ', 'Lo lắng trong tình cảm, nghĩ quá nhiều', 'Áp lực công việc, mất ngủ vì lo'],
  ['Kết thúc, phản bội, chạm đáy, khủng hoảng', 'Hồi phục, tái tạo, đứng dậy', 'Chia tay đau đớn, chạm đáy', 'Sự nghiệp sụp đổ, lúc xây lại'],
  ['Tò mò, bồn chồn, năng lượng trí óc', 'Lừa lọc, thao túng, chỉ nói không làm', 'Tò mò về tình yêu, nghĩ quá nhiều về cảm xúc', 'Ý tưởng mới, nghiên cứu, khám phá'],
  ['Tham vọng, hành động, bốc đồng, nghĩ nhanh', 'Mất phương hướng, bất cẩn, hung hăng', 'Lao vào tình yêu, theo đuổi dồn dập', 'Hành động quyết liệt, xử lý nhanh'],
  ['Độc lập, ranh giới rõ ràng, nói thẳng', 'Lạnh lùng, cay nghiệt, chua chát', 'Người yêu độc lập, giao tiếp thẳng thắn', 'Lãnh đạo rõ ràng, quyết định khách quan'],
  ['Trí tuệ, uy quyền, sự thật, đạo đức', 'Thao túng, độc đoán, lạm quyền', 'Người yêu lý trí, giao tiếp rõ ràng', 'Người có thẩm quyền, chuyên môn pháp lý'],
  // Pentacles (Tiền)
  ['Cơ hội mới, thịnh vượng, dư dả', 'Lỡ cơ hội, thiếu thốn, bất ổn', 'Khởi đầu một mối quan hệ ổn định', 'Việc làm mới, cơ hội tài chính'],
  ['Cân bằng, linh hoạt, xoay xở nhiều việc', 'Mất cân bằng, thiếu tổ chức, quá tải', 'Cân bằng tình yêu và cuộc sống', 'Cân bằng công việc – cuộc sống, quản lý nhiều dự án'],
  ['Làm việc nhóm, hợp tác, tay nghề', 'Thiếu phối hợp, lộn xộn, mâu thuẫn', 'Cùng nhau xây dựng, chung mục tiêu', 'Dự án nhóm, tay nghề được ghi nhận'],
  ['An toàn, kiểm soát, tiết kiệm, ổn định', 'Tham lam, nặng vật chất, khép mình phòng vệ', 'Chiếm hữu, sợ mở lòng', 'An toàn tài chính, giữ chặt nguồn lực'],
  ['Khó khăn, mất mát, cô lập, thấy bị bỏ rơi', 'Hồi phục, khá lên, qua được khúc quanh', 'Cô đơn, cảm thấy bị từ chối', 'Khó khăn tài chính, mất việc'],
  ['Hào phóng, cho đi, chia sẻ, cân bằng', 'Nợ nần, ích kỷ, cho đi có điều kiện', 'Người yêu rộng lượng, cho và nhận', 'Tăng lương, thưởng, làm từ thiện'],
  ['Kiên nhẫn, nhìn dài hạn, đầu tư, bền bỉ', 'Nóng vội, chưa thấy kết quả, công sức phí hoài', 'Kiên nhẫn trong tình yêu, đầu tư lâu dài', 'Sự nghiệp cần thời gian, hãy kiên nhẫn'],
  ['Tay nghề, rèn kỹ năng, chăm chỉ', 'Cầu toàn, thiếu chí tiến thủ, làng nhàng', 'Cùng nhau vun đắp, tiến bộ cùng nhau', 'Rèn kỹ năng, học việc, làm việc chăm chỉ'],
  ['Sung túc, tận hưởng, tự chủ, độc lập', 'Quá sa đà công việc, hời hợt', 'Tận hưởng độc thân, yêu bản thân', 'Độc lập tài chính, tận hưởng thành quả'],
  ['Giàu có, di sản, gia đình, nền tảng vững', 'Thất bại tài chính, bất hoà gia đình', 'Tình yêu bền lâu, gia đình sung túc', 'Thành công tài chính, kinh doanh gia đình'],
  ['Chí tiến thủ, chăm học, cơ hội tài chính mới', 'Chậm tiến bộ, trì hoãn', 'Tình cảm mới vững vàng, xây nền móng', 'Học bổng, việc mới, cơ hội học tập'],
  ['Đáng tin, chăm chỉ, nề nếp, kiên nhẫn', 'Nhàm chán, lười biếng, thấy giậm chân', 'Người yêu chung thuỷ, tình cảm chậm mà chắc', 'Làm việc đáng tin cậy, có phương pháp'],
  ['Chăm lo, thực tế, an toàn tài chính, yêu gia đình', 'Bỏ bê, bao bọc quá mức, lệch cân bằng việc – nhà', 'Người yêu chu đáo, hạnh phúc gia đình', 'Nữ doanh nhân thành đạt, lãnh đạo thực tế'],
  ['Giàu có, kinh doanh, lãnh đạo, an toàn, kỷ luật', 'Tham lam, hưởng thụ quá đà, vật chất', 'Người che chở vững vàng, mối quan hệ an toàn', 'Kinh doanh thành công, làm chủ tài chính'],
];

export interface CardMeaningVi {
  upright: string;
  reversed: string;
  love: string;
  career: string;
}

export function cardMeaningVi(cardNumber: number): CardMeaningVi | undefined {
  const t = CARD_MEANINGS_VI[cardNumber];
  return t ? { upright: t[0], reversed: t[1], love: t[2], career: t[3] } : undefined;
}
