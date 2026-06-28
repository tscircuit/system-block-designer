interface ZipHeaderParams {
  signature: number
  pathBytes: Uint8Array
  contentBytes: Uint8Array
  checksum: number
  localFileHeaderOffset?: number
}

export function createZip(files: Record<string, string>) {
  const encoder = new TextEncoder()
  const localFileHeaders: Uint8Array[] = []
  const centralDirectoryHeaders: Uint8Array[] = []
  let offset = 0

  for (const [path, content] of Object.entries(files).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const pathBytes = encoder.encode(path)
    const contentBytes = encoder.encode(content)
    const checksum = crc32(contentBytes)
    const localFileHeader = createZipHeader({
      signature: 0x04034b50,
      pathBytes,
      contentBytes,
      checksum,
    })
    const centralDirectoryHeader = createZipHeader({
      signature: 0x02014b50,
      pathBytes,
      contentBytes,
      checksum,
      localFileHeaderOffset: offset,
    })

    localFileHeaders.push(localFileHeader, contentBytes)
    centralDirectoryHeaders.push(centralDirectoryHeader)
    offset += localFileHeader.length + contentBytes.length
  }

  const centralDirectoryOffset = offset
  const centralDirectorySize = centralDirectoryHeaders.reduce(
    (size, header) => size + header.length,
    0,
  )
  const endOfCentralDirectory = new Uint8Array(22)
  const view = new DataView(endOfCentralDirectory.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, centralDirectoryHeaders.length, true)
  view.setUint16(10, centralDirectoryHeaders.length, true)
  view.setUint32(12, centralDirectorySize, true)
  view.setUint32(16, centralDirectoryOffset, true)

  return concatBytes([
    ...localFileHeaders,
    ...centralDirectoryHeaders,
    endOfCentralDirectory,
  ])
}

function createZipHeader({
  signature,
  pathBytes,
  contentBytes,
  checksum,
  localFileHeaderOffset = 0,
}: ZipHeaderParams) {
  const isCentralDirectory = signature === 0x02014b50
  const header = new Uint8Array(
    (isCentralDirectory ? 46 : 30) + pathBytes.length,
  )
  const view = new DataView(header.buffer)
  view.setUint32(0, signature, true)

  if (isCentralDirectory) {
    view.setUint16(4, 20, true)
    view.setUint16(6, 20, true)
    view.setUint32(16, checksum, true)
    view.setUint32(20, contentBytes.length, true)
    view.setUint32(24, contentBytes.length, true)
    view.setUint16(28, pathBytes.length, true)
    view.setUint32(42, localFileHeaderOffset, true)
    header.set(pathBytes, 46)
    return header
  }

  view.setUint16(4, 20, true)
  view.setUint32(14, checksum, true)
  view.setUint32(18, contentBytes.length, true)
  view.setUint32(22, contentBytes.length, true)
  view.setUint16(26, pathBytes.length, true)
  header.set(pathBytes, 30)
  return header
}

function concatBytes(chunks: Uint8Array[]) {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const output = new Uint8Array(size)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }

  return output
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff

  for (const byte of bytes) {
    crc ^= byte

    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}
