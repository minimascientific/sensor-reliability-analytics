import streamlit as st

st.set_page_config(
    page_title="Sensor Reliability Analytics",
    page_icon="📈",
    layout="wide",
)

st.title("Sensor Reliability Analytics Platform")

st.caption(
    "Interactive analysis of simulated blood-ion sensor characterization, "
    "environmental qualification, and reliability data."
)

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Production Lots", "20")

with col2:
    st.metric("Devices", "10,000")

with col3:
    st.metric("Test Records", "240,000+")

st.divider()

st.subheader("Project Status")

st.write(
    """
    The PostgreSQL data layer is complete. The application will provide
    interactive views for manufacturing lot performance, reliability drift,
    environmental qualification, and degradation-risk analysis.
    """
)