import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Có bản cập nhật ứng dụng mới. Bạn có muốn tải lại trang ngay?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('Ứng dụng đã sẵn sàng chạy ngoại tuyến (offline).')
  },
})
