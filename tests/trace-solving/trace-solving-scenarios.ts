import type { SystemJson } from "../../lib/system-json/system-json"

export const obstacleAvoidanceSystem: SystemJson[] = [
  diagram("Trace Obstacle Avoidance"),
  block("mcu", "MCU", 100, 160, 130, 96, "chip"),
  block("secure_element", "Secure Element", 320, 160, 142, 112, "chip"),
  block("radio", "Radio", 540, 160, 140, 104, "antenna"),
  port("mcu_spi", "mcu", "right", "SPI"),
  port("radio_spi", "radio", "left", "SPI"),
  connection("spi_trace", "mcu_spi", "radio_spi", "spi"),
]

export const crossingBusesSystem: SystemJson[] = [
  diagram("Trace Crossing Buses"),
  block("controller", "Controller", 110, 220, 132, 92, "chip"),
  block("imu", "IMU", 430, 80, 132, 92, "chip"),
  block("display", "Display", 430, 220, 132, 92, "chip"),
  block("charger", "Charger", 430, 360, 132, 92, "power"),
  block("battery", "Battery", 110, 360, 132, 92, "battery"),
  port("controller_i2c", "controller", "right", "I2C"),
  port("controller_spi", "controller", "right", "SPI"),
  port("controller_pwr", "controller", "bottom", "VDD"),
  port("imu_i2c", "imu", "left", "I2C"),
  port("display_spi", "display", "left", "SPI"),
  port("charger_out", "charger", "left", "3V3"),
  port("battery_out", "battery", "top", "VBAT"),
  connection("i2c_trace", "controller_i2c", "imu_i2c", "i2c"),
  connection("spi_trace", "controller_spi", "display_spi", "spi"),
  connection("battery_trace", "battery_out", "controller_pwr", "VBAT"),
  connection("supply_trace", "charger_out", "controller_pwr", "3V3"),
]

export const compactFanoutSystem: SystemJson[] = [
  diagram("Trace Compact Fanout"),
  block("pmic", "PMIC", 120, 220, 124, 112, "power"),
  block("sensor", "Sensor", 420, 80, 126, 72, "chip"),
  block("radio", "Radio", 420, 172, 126, 72, "antenna"),
  block("memory", "Memory", 420, 264, 126, 72, "chip"),
  block("led_driver", "LED Driver", 420, 356, 126, 72, "chip"),
  port("vout_a", "pmic", "right", "3V3"),
  port("vout_b", "pmic", "right", "3V3"),
  port("vout_c", "pmic", "right", "3V3"),
  port("vout_d", "pmic", "right", "3V3"),
  port("sensor_vin", "sensor", "left", "VIN"),
  port("radio_vin", "radio", "left", "VIN"),
  port("memory_vin", "memory", "left", "VIN"),
  port("led_driver_vin", "led_driver", "left", "VIN"),
  connection("sensor_supply", "vout_a", "sensor_vin", "3V3"),
  connection("radio_supply", "vout_b", "radio_vin", "3V3"),
  connection("memory_supply", "vout_c", "memory_vin", "3V3"),
  connection("led_driver_supply", "vout_d", "led_driver_vin", "3V3"),
]

export const mixedSidePortsSystem: SystemJson[] = [
  diagram("Trace Mixed Side Ports"),
  block("sensor_hub", "Sensor Hub", 220, 210, 150, 112, "chip"),
  block("temperature", "Temp", 220, 40, 124, 78, "chip"),
  block("actuator", "Actuator", 470, 210, 134, 96, "power"),
  block("debug", "Debug", 30, 210, 120, 90, "chip"),
  block("battery", "Battery", 220, 390, 132, 86, "battery"),
  port("hub_i2c", "sensor_hub", "top", "I2C"),
  port("temp_i2c", "temperature", "bottom", "I2C"),
  port("hub_pwm", "sensor_hub", "right", "PWM"),
  port("actuator_pwm", "actuator", "left", "PWM"),
  port("debug_uart", "debug", "right", "UART"),
  port("hub_uart", "sensor_hub", "left", "UART"),
  port("battery_vbat", "battery", "top", "VBAT"),
  port("hub_vbat", "sensor_hub", "bottom", "VBAT"),
  connection("i2c_vertical", "hub_i2c", "temp_i2c", "i2c"),
  connection("pwm_horizontal", "hub_pwm", "actuator_pwm", "gpio"),
  connection("uart_left", "debug_uart", "hub_uart", "uart"),
  connection("power_vertical", "battery_vbat", "hub_vbat", "VBAT"),
]

function diagram(name: string): SystemJson {
  return {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name,
  }
}

function block(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  icon: string,
): SystemJson {
  return {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: id,
    center: { x, y },
    size: { width, height },
    label,
    category: ["trace-solving"],
    icon,
  }
}

function port(
  id: string,
  blockId: string,
  side: "left" | "right" | "top" | "bottom",
  label: string,
): SystemJson {
  return {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: id,
    system_block_id: blockId,
    side_of_block: side,
    label,
  }
}

function connection(
  id: string,
  sourcePortId: string,
  targetPortId: string,
  label: string,
): SystemJson {
  return {
    type: "system_connection",
    system_diagram_id: "system_diagram_0",
    system_connection_id: id,
    source_system_port_id: sourcePortId,
    target_system_port_id: targetPortId,
    system_port_ids: [sourcePortId, targetPortId],
    path: [],
    label,
  }
}
