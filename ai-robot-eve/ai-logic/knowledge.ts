
import { KnowledgeEntry } from './types';

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // Physics / Antennas
  {
    id: 'dipole_def',
    keywords: ['dipole', 'lưỡng cực', 'anten dipol'],
    response: "Anten Dipole (Lưỡng cực) là loại anten cơ bản nhất, thường có chiều dài λ/2. Búp sóng có dạng hình xuyến (donut) với điểm 'không' nằm dọc theo trục anten. Công thức bức xạ lý tưởng: R(θ) = |sin(θ)|.",
    category: 'physics'
  },
  {
    id: 'yagi_def',
    keywords: ['yagi', 'uda', 'định hướng', 'directional'],
    response: "Anten Yagi-Uda bao gồm một chấn tử chủ động (driven), một chấn tử phản xạ (reflector) và các chấn tử dẫn hướng (directors). Nó có độ lợi cao và tính định hướng mạnh về phía các thanh dẫn hướng.",
    category: 'physics'
  },
  {
    id: 'horn_def',
    keywords: ['horn', 'anten loa', 'loa'],
    response: "Anten Horn (Loa) được sử dụng ở tần số siêu cao (Microwave). Nó hoạt động như một ống dẫn sóng loe ra để phối hợp trở kháng với không gian tự do. Độ lợi rất cao và búp sóng hẹp.",
    category: 'physics'
  },
  {
    id: 'parabolic_def',
    keywords: ['parabolic', 'chảo', 'dish', 'vệ tinh'],
    response: "Anten Parabol sử dụng mặt phản xạ cong để tập trung sóng về một điểm tiêu cự (feed). Nó tạo ra búp sóng cực hẹp (pencil beam) và có độ lợi rất lớn, thường dùng cho liên lạc vệ tinh hoặc radar.",
    category: 'physics'
  },
  {
    id: 'microstrip_def',
    keywords: ['patch', 'vi dải', 'microstrip', 'pcb'],
    response: "Anten Vi dải (Patch) được chế tạo trên mạch in (PCB). Nó nhỏ gọn, nhẹ, dễ tích hợp nhưng băng thông hẹp. Bức xạ thường hướng vuông góc với mặt phẳng anten.",
    category: 'physics'
  },
  {
    id: 'gain_expl',
    keywords: ['gain', 'độ lợi', 'dbi'],
    response: "Gain (Độ lợi) là thước đo khả năng tập trung năng lượng bức xạ của anten về một hướng cụ thể so với anten đẳng hướng (Isotropic). Đơn vị thường là dBi.",
    category: 'physics'
  },

  // Usage / Controls
  {
    id: 'vr_controls',
    keywords: ['vr', 'cử chỉ', 'tay', 'hand', 'control', 'điều khiển'],
    response: "Hệ thống hỗ trợ điều khiển bằng tay qua Webcam:\n- Nắm tay (FIST): Xoay mô hình anten.\n- Mở tay (OPEN PALM): Dừng xoay / Chọn.\n- Hai tay: Đưa lại gần hoặc xa nhau để Zoom.",
    category: 'usage'
  },
  {
    id: 'freq_sweep',
    keywords: ['sweep', 'quét', 'tần số'],
    response: "Chức năng 'Quét Tần Số' cho phép bạn xem sự thay đổi của búp sóng khi tần số thay đổi liên tục trong khoảng Start-End. Hữu ích để phân tích băng thông hoạt động.",
    category: 'usage'
  },
  {
    id: 'fdtd_help',
    keywords: ['fdtd', 'thời gian', 'time domain'],
    response: "Mô phỏng FDTD (Finite Difference Time Domain) tính toán trường điện từ theo thời gian thực bằng cách giải phương trình Maxwell trên lưới không gian. Nó cho thấy sự lan truyền sóng trực quan.",
    category: 'usage'
  }
];
